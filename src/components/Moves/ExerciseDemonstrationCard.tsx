import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  RotateCcw,
  Plus,
  Minus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Clock,
  Sparkles,
} from "lucide-react";
import { ExerciseItem } from "../../types";

interface ExerciseDemonstrationCardProps {
  exercise: ExerciseItem;
  exerciseIndex: number;
  totalExercises: number;
  isCompleted: boolean;
  onCompleteExercise: (exerciseId: string) => void;
}

export const ExerciseDemonstrationCard: React.FC<ExerciseDemonstrationCardProps> = ({
  exercise,
  exerciseIndex,
  totalExercises,
  isCompleted,
  onCompleteExercise,
}) => {
  // 3-Step Image Position: 1 = START, 2 = MOVEMENT, 3 = FINISH
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [showAlternative, setShowAlternative] = useState<boolean>(false);
  const [showCues, setShowCues] = useState<boolean>(false);

  // Repetition Tracking (0 / targetReps)
  const targetReps = exercise.targetReps || 10;
  const [currentReps, setCurrentReps] = useState<number>(0);

  // Timed Hold Tracking (for Plank, etc.)
  const targetSeconds = exercise.targetSeconds || 20;
  const [timerRemaining, setTimerRemaining] = useState<number>(targetSeconds);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  const [justFinished, setJustFinished] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timed Exercise Countdown Logic
  useEffect(() => {
    if (exercise.isTimed && isTimerActive && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current as NodeJS.Timeout);
            setIsTimerActive(false);
            handleTriggerCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [exercise.isTimed, isTimerActive, timerRemaining]);

  const handleIncrementRep = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isCompleted && currentReps >= targetReps) return;

    const nextReps = currentReps + 1;
    setCurrentReps(nextReps);

    // Auto switch step demonstration image as reps progress to reinforce technique:
    // rep 1-3: START, rep 4-7: MOVEMENT, rep 8+: FINISH
    if (nextReps <= Math.floor(targetReps / 3)) {
      setActiveStepIndex(0);
    } else if (nextReps <= Math.floor((targetReps * 2) / 3)) {
      setActiveStepIndex(1);
    } else {
      setActiveStepIndex(2);
    }

    if (nextReps >= targetReps && !isCompleted) {
      handleTriggerCompletion();
    }
  };

  const handleUndoRep = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentReps > 0) {
      setCurrentReps((prev) => prev - 1);
    }
  };

  const handleTriggerCompletion = () => {
    setJustFinished(true);
    onCompleteExercise(exercise.id);
    setTimeout(() => {
      setJustFinished(false);
    }, 1200);
  };

  const handleResetTimer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTimerActive(false);
    setTimerRemaining(targetSeconds);
  };

  const currentStep = exercise.steps[activeStepIndex] || exercise.steps[0];

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : exercise.steps.length - 1));
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveStepIndex((prev) => (prev < exercise.steps.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* Main Interactive Exercise Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          isCompleted || currentReps >= targetReps
            ? "bg-[#060614]/85 border-[#D4AF37]/40 shadow-[0_4px_25px_rgba(212,175,55,0.1)]"
            : "bg-[#0b0c1e] border-white/10 hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)]"
        }`}
      >
        {/* Accent Bar */}
        <div
          className={`h-1 w-full transition-colors duration-300 ${
            isCompleted || currentReps >= targetReps
              ? "bg-gradient-to-r from-[#D4AF37] via-[#f7d978] to-[#B8860B]"
              : "bg-gradient-to-r from-cyan-500/40 via-cyan-400 to-blue-600"
          }`}
        />

        <div className="p-4 sm:p-5 space-y-4">
          {/* Card Header: Name, Target, Completion Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                  EXERCISE {exerciseIndex + 1} OF {totalExercises}
                </span>
                {exercise.isTimed && (
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                    TIMED HOLD
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {exercise.name}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-[#D4AF37] tracking-wider uppercase">
                  {exercise.target}
                </span>
                <span className="text-zinc-600 text-xs">/</span>
                <span className="text-[11px] text-zinc-400 font-light truncate">
                  {showAlternative ? exercise.alternative.name : "Standard Form"}
                </span>
              </div>
            </div>

            {/* Status or Start Button */}
            <div className="shrink-0 pt-1">
              {isCompleted || currentReps >= targetReps ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>COMPLETE</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFocusedMode(true)}
                  className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold transition-all cursor-pointer hover:border-cyan-400/60"
                >
                  START MOVE
                </button>
              )}
            </div>
          </div>

          {/* 3-Step Interactive Image Demonstration Viewer */}
          <div className="space-y-2">
            {/* Step Selection Buttons: 1 / 2 / 3 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {exercise.steps.map((st, idx) => (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`py-1 px-2.5 sm:px-3 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeStepIndex === idx
                        ? "bg-cyan-950/80 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-[10px] text-cyan-400">
                      {st.step}
                    </span>
                    <span className="hidden sm:inline">
                      {st.step === 1 ? "START" : st.step === 2 ? "MOVEMENT" : "FINISH"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Expand to Focused Mode */}
              <button
                type="button"
                onClick={() => setIsFocusedMode(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Open Focused Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Display Image with Position Label & Arrows */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black border border-white/10 select-none">
              <img
                src={currentStep.imageUrl}
                alt={`${exercise.name} - ${currentStep.label}`}
                className="w-full h-full object-cover transition-opacity duration-200"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

              {/* Step Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{currentStep.label}</span>
              </div>

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={handlePrevStep}
                aria-label="Previous position"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                aria-label="Next position"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Instruction Caption */}
              <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none">
                <p className="text-[11px] text-zinc-200 font-light truncate drop-shadow-md">
                  {currentStep.instruction}
                </p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE TRACKING BAR: 0 / 10 Reps or Timer Hold */}
          <div className="p-3.5 rounded-xl bg-[#050510] border border-white/10 space-y-3">
            {!exercise.isTimed ? (
              /* Repetition Counter Controls */
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                    COMPLETED REPS
                  </div>
                  <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl transition-colors ${
                        currentReps >= targetReps ? "text-[#D4AF37]" : "text-cyan-400"
                      }`}
                    >
                      {currentReps}
                    </span>
                    <span className="text-zinc-500 text-sm">/ {targetReps}</span>
                  </div>
                </div>

                {/* +1 REP and UNDO buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndoRep}
                    disabled={currentReps <= 0}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-zinc-300 font-mono text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Undo last rep"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>UNDO</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleIncrementRep}
                    className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_16px_rgba(6,182,212,0.25)] transition-all cursor-pointer active:scale-95 ${
                      currentReps >= targetReps
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{currentReps >= targetReps ? "MOVE COMPLETE" : "+1 REP"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Timed Exercise Countdown (Plank) */
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                    PLANK HOLD
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300">
                    {timerRemaining}s / {targetSeconds}s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerActive(!isTimerActive)}
                    className="py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    {isTimerActive ? "PAUSE" : timerRemaining < targetSeconds ? "RESUME" : "START TIMER"}
                  </button>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={handleTriggerCompletion}
                      className="py-2 px-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      COMPLETE
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Rep / Time Mini Progress Bar */}
            <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-300 ${
                  currentReps >= targetReps || isCompleted
                    ? "bg-[#D4AF37]"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500"
                }`}
                style={{
                  width: !exercise.isTimed
                    ? `${Math.min(100, (currentReps / targetReps) * 100)}%`
                    : `${Math.min(100, ((targetSeconds - timerRemaining) / targetSeconds) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Form Cues & Alternative Accordions */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowCues(!showCues)}
                className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{showCues ? "Hide form cues" : "View form cues"}</span>
                {showCues ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowAlternative(!showAlternative)}
                className="text-amber-400/90 hover:text-amber-300 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {showAlternative ? "Standard variation" : "Accessible alternative"}
              </button>
            </div>

            <AnimatePresence>
              {showCues && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-black/40 border border-white/10 p-3 space-y-2 text-xs text-zinc-300"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    TECHNIQUE DIRECTIVES
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] text-zinc-300 leading-relaxed">
                    {exercise.keyCues.map((cue, idx) => (
                      <li key={idx} className="marker:text-cyan-400">
                        {cue}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-white/5 flex items-start gap-1.5 text-[10px] text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{exercise.safetyNotice}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAlternative && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-3 space-y-1 text-xs"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    ACCESSIBLE VARIATION: {exercise.alternative.name}
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed font-light">
                    {exercise.alternative.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* START MOVE Focused Screen: 3-step interactive instructional images */}
      <AnimatePresence>
        {isFocusedMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-2xl bg-[#0b0c1e] border rounded-3xl overflow-hidden shadow-2xl space-y-4 ${
                justFinished || currentReps >= targetReps
                  ? "border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.3)] ring-2 ring-[#D4AF37]"
                  : "border-cyan-500/30"
              }`}
            >
              {/* Top Bar */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                    FOCUSED MOVE SESSION · {exerciseIndex + 1} OF {totalExercises}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{exercise.name}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFocusedMode(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              {/* Large Centered 3-Step Image Demonstration Viewer */}
              <div className="px-4 sm:px-6 space-y-2">
                {/* 1 / 2 / 3 Step Selector */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {exercise.steps.map((st, idx) => (
                      <button
                        key={st.step}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={`py-1.5 px-3.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeStepIndex === idx
                            ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <span>{st.step}</span>
                        <span>{st.step === 1 ? "START" : st.step === 2 ? "MOVEMENT" : "FINISH"}</span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    Step {activeStepIndex + 1} of 3
                  </span>
                </div>

                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-inner">
                  <img
                    src={currentStep.imageUrl}
                    alt={`${exercise.name} - ${currentStep.label}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                  {/* Step Label Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-cyan-400/50 text-xs font-mono text-cyan-300 font-bold">
                    <span>{currentStep.label}</span>
                  </div>

                  {/* Left / Right Navigation */}
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Instruction Bar */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs text-zinc-200">
                    <span className="font-mono text-cyan-400 font-bold mr-2">
                      {currentStep.label}:
                    </span>
                    {currentStep.instruction}
                  </div>
                </div>
              </div>

              {/* Large Interactive Tracking Controls */}
              <div className="px-4 sm:px-6">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  {!exercise.isTimed ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          TARGET: {exercise.target}
                        </div>
                        <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
                          <span
                            className={`text-3xl ${
                              currentReps >= targetReps ? "text-[#D4AF37]" : "text-cyan-400"
                            }`}
                          >
                            {currentReps}
                          </span>
                          <span className="text-zinc-500">/ {targetReps} REPS</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleUndoRep}
                          disabled={currentReps <= 0}
                          className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 border border-white/15 text-zinc-200 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                        >
                          UNDO
                        </button>

                        <button
                          type="button"
                          onClick={handleIncrementRep}
                          className={`flex-1 sm:flex-none py-3 px-8 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer ${
                            currentReps >= targetReps
                              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                          }`}
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>{currentReps >= targetReps ? "MOVE COMPLETE" : "+1 REP"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          TARGET HOLD
                        </div>
                        <div className="text-3xl font-bold font-mono text-cyan-300">
                          {timerRemaining}s / {targetSeconds}s
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleResetTimer}
                          className="py-2.5 px-3 rounded-xl bg-white/10 text-zinc-300 hover:text-white border border-white/15 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsTimerActive(!isTimerActive)}
                          className="flex-1 sm:flex-none py-3 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                        >
                          {isTimerActive ? "PAUSE TIMER" : timerRemaining < targetSeconds ? "RESUME" : "START TIMER"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleTriggerCompletion();
                            setIsFocusedMode(false);
                          }}
                          className="py-3 px-5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                        >
                          COMPLETE
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentReps >= targetReps || isCompleted
                          ? "bg-[#D4AF37]"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500"
                      }`}
                      style={{
                        width: !exercise.isTimed
                          ? `${Math.min(100, (currentReps / targetReps) * 100)}%`
                          : `${Math.min(100, ((targetSeconds - timerRemaining) / targetSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Awards +25 CRESCIVE XP</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleTriggerCompletion();
                    setIsFocusedMode(false);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer"
                >
                  Mark as Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
