import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoveItem, TrainingCycleDay, DailyEssentialCategory, DailyMovesState } from "../../types";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Trash2,
  Tag,
  Sparkles,
  Bell,
  Calendar,
  Play,
  Zap,
  Edit3,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  Loader2,
  Activity,
  Droplets,
  Moon,
  BookOpen,
  Wind,
  Heart,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Check,
  Flame,
} from "lucide-react";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { deleteMoveCalendarEvent } from "../../utils/googleCalendarService";
import { WORKOUT_CYCLE_DAYS } from "../../data/movesProgram";
import { ExerciseDemonstrationCard } from "./ExerciseDemonstrationCard";
import { WarmupModal } from "./WarmupModal";
import { SpeedDrillCard } from "./SpeedDrillCard";
import { HydrateCard } from "./HydrateCard";
import { RecoveryCard } from "./RecoveryCard";
import { FocusCard } from "./FocusCard";
import { LearnCard } from "./LearnCard";
import { ResetCard } from "./ResetCard";
import { ConnectCard } from "./ConnectCard";
import { DayCompleteModal } from "./DayCompleteModal";
import {
  getStoredDailyMoves,
  saveDailyMovesState,
  getTodayDateString,
  calculateCompletedEssentialsCount,
  setStoredCycleDay,
} from "../../utils/dailyMovesStorage";
import { auth } from "../../lib/firebase";

interface MovesScreenProps {
  moves: MoveItem[];
  onOpenCreateMove: (mode?: "create" | "ideas") => void;
  onEditMove?: (move: MoveItem) => void;
  onToggleMove: (id: string) => void;
  onDeleteMove: (id: string) => void;
  onStartFocusSession?: (move: MoveItem | null, customDuration?: number) => void;
}

export const MovesScreen: React.FC<MovesScreenProps> = ({
  moves,
  onOpenCreateMove,
  onEditMove,
  onToggleMove,
  onDeleteMove,
  onStartFocusSession,
}) => {
  // Active Section: Today's Interactive Moves vs Custom Saved Moves
  const [activeView, setActiveView] = useState<"essentials" | "saved">("essentials");

  // Daily Moves State
  const [dailyState, setDailyState] = useState<DailyMovesState>(() => getStoredDailyMoves());
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isDayCompleteModalOpen, setIsDayCompleteModalOpen] = useState(false);

  // Custom Moves Filters
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  // Deletion with Google Calendar confirmation modal
  const [movePendingDelete, setMovePendingDelete] = useState<MoveItem | null>(null);
  const [isDeletingCalendarEvent, setIsDeletingCalendarEvent] = useState(false);

  // Load and refresh state for today
  useEffect(() => {
    const today = getTodayDateString();
    if (dailyState.date !== today) {
      const refreshed = getStoredDailyMoves(today);
      setDailyState(refreshed);
    }
  }, [dailyState.date]);

  // Sync state whenever dailyState updates
  const updateDailyState = (updater: (prev: DailyMovesState) => DailyMovesState) => {
    setDailyState((prev) => {
      const updated = updater(prev);
      saveDailyMovesState(updated, auth.currentUser?.uid);

      // Check if all 7 essentials completed and trigger celebration modal
      const prevCompleted = calculateCompletedEssentialsCount(prev);
      const newCompleted = calculateCompletedEssentialsCount(updated);
      if (newCompleted === 7 && prevCompleted < 7 && !updated.dayCompleted) {
        updated.dayCompleted = true;
        updated.dayCompletedAt = new Date().toISOString();
        updated.streakDays = (prev.streakDays || 0) + 1;
        saveDailyMovesState(updated, auth.currentUser?.uid);
        setIsDayCompleteModalOpen(true);
      }

      return updated;
    });
  };

  // Workout Handlers
  const currentProgramDay = WORKOUT_CYCLE_DAYS[dailyState.cycleDay] || WORKOUT_CYCLE_DAYS[1];

  const handleCompleteExercise = (exerciseId: string) => {
    updateDailyState((prev) => {
      const existing = prev.workout.completedExerciseIds || [];
      const updatedExerciseIds = existing.includes(exerciseId)
        ? existing
        : [...existing, exerciseId];

      const allExercisesDone = currentProgramDay.exercises.every((ex) =>
        updatedExerciseIds.includes(ex.id)
      );

      const isWorkoutNowDone = allExercisesDone;

      return {
        ...prev,
        workout: {
          ...prev.workout,
          completedExerciseIds: updatedExerciseIds,
          completed: isWorkoutNowDone,
          completedAt: isWorkoutNowDone ? new Date().toISOString() : prev.workout.completedAt,
        },
        completedEssentials: {
          ...prev.completedEssentials,
          move: isWorkoutNowDone,
        },
        xpEarnedToday: prev.xpEarnedToday + 25,
      };
    });
  };

  const handleCompleteSpeedDrill = () => {
    updateDailyState((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        speedCompleted: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 15,
    }));
  };

  const handleWarmupFinished = () => {
    updateDailyState((prev) => ({
      ...prev,
      workout: {
        ...prev.workout,
        warmupCompleted: true,
      },
    }));
  };

  const handleLogWaterBreak = () => {
    updateDailyState((prev) => {
      const newCount = prev.hydrationBreaksCount + 1;
      return {
        ...prev,
        hydrationBreaksCount: newCount,
        hydrationLastLoggedAt: new Date().toISOString(),
        completedEssentials: {
          ...prev.completedEssentials,
          hydrate: newCount >= 2,
        },
        xpEarnedToday: prev.xpEarnedToday + 10,
      };
    });
  };

  const handleRecordRecovery = (activityTitle?: string) => {
    updateDailyState((prev) => ({
      ...prev,
      recoveryCompleted: true,
      recoveryNotes: activityTitle,
      completedEssentials: {
        ...prev.completedEssentials,
        rest: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 20,
    }));
  };

  const handleMarkFocusComplete = (minutes: number) => {
    updateDailyState((prev) => ({
      ...prev,
      focusCompleted: true,
      focusMinutesCompleted: (prev.focusMinutesCompleted || 0) + minutes,
      completedEssentials: {
        ...prev.completedEssentials,
        focus: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 25,
    }));
  };

  const handleCompleteLearn = (note?: string) => {
    updateDailyState((prev) => ({
      ...prev,
      learnCompleted: true,
      learnNotes: note,
      completedEssentials: {
        ...prev.completedEssentials,
        learn: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 25,
    }));
  };

  const handleCompleteReset = () => {
    updateDailyState((prev) => ({
      ...prev,
      resetCompleted: true,
      resetAt: new Date().toISOString(),
      completedEssentials: {
        ...prev.completedEssentials,
        reset: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 20,
    }));
  };

  const handleRecordConnect = (note?: string) => {
    updateDailyState((prev) => ({
      ...prev,
      connectCompleted: true,
      connectNotes: note,
      completedEssentials: {
        ...prev.completedEssentials,
        connect: true,
      },
      xpEarnedToday: prev.xpEarnedToday + 20,
    }));
  };

  const handleSelectCycleDay = (day: TrainingCycleDay) => {
    setStoredCycleDay(day);
    updateDailyState((prev) => ({
      ...prev,
      cycleDay: day,
      workout: {
        warmupCompleted: false,
        completedExerciseIds: [],
        speedCompleted: false,
        completed: false,
      },
    }));
  };

  // Saved Moves Filtering
  const filteredMoves = moves.filter((m) => {
    if (filter === "active" && m.completed) return false;
    if (filter === "completed" && !m.completed) return false;
    if (selectedDomain !== "all" && m.domain !== selectedDomain) return false;
    return true;
  });

  const completedCount = moves.filter((m) => m.completed).length;

  const handleDeleteRequest = (move: MoveItem) => {
    if (move.googleCalendarEventId) {
      setMovePendingDelete(move);
    } else {
      onDeleteMove(move.id);
    }
  };

  const handleConfirmDeleteBoth = async () => {
    if (!movePendingDelete) return;
    setIsDeletingCalendarEvent(true);
    try {
      if (movePendingDelete.googleCalendarEventId) {
        await deleteMoveCalendarEvent(movePendingDelete.googleCalendarEventId);
      }
    } catch (e) {
      console.warn("Failed to delete event from Google Calendar:", e);
    } finally {
      setIsDeletingCalendarEvent(false);
      onDeleteMove(movePendingDelete.id);
      setMovePendingDelete(null);
    }
  };

  const handleConfirmDeleteLocalOnly = () => {
    if (!movePendingDelete) return;
    onDeleteMove(movePendingDelete.id);
    setMovePendingDelete(null);
  };

  // Progress Calculations
  const completedEssentialsCount = calculateCompletedEssentialsCount(dailyState);
  const progressPercent = Math.round((completedEssentialsCount / 7) * 100);

  // Motivational message
  const getMotivationalText = () => {
    if (completedEssentialsCount === 0) return "Small actions count.";
    if (completedEssentialsCount <= 2) return "Keep moving. One more move.";
    if (completedEssentialsCount <= 5) return "Progress is built daily.";
    if (completedEssentialsCount < 7) return "Almost complete. Finish with intent.";
    return "Day complete. Progress made.";
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header & Philosophy Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
            EXECUTION & WELLBEING ARCHITECTURE
          </span>
          <h1 className="text-2xl sm:text-3xl font-light font-serif-cresive text-white tracking-wide">
            TODAY&apos;S MOVES
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            &ldquo;Small actions. Real progress.&rdquo;
          </p>
        </div>

        {/* View Switcher: Interactive Essentials vs Saved Moves */}
        <div className="flex items-center gap-1.5 p-1 bg-[#101025] rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveView("essentials")}
            className={`py-2 px-4 rounded-xl font-mono font-bold transition-all cursor-pointer ${
              activeView === "essentials"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_2px_12px_rgba(6,182,212,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            DAILY ESSENTIALS ({completedEssentialsCount}/7)
          </button>

          <button
            type="button"
            onClick={() => setActiveView("saved")}
            className={`py-2 px-4 rounded-xl font-mono font-bold transition-all cursor-pointer ${
              activeView === "saved"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_2px_12px_rgba(212,175,55,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            SAVED MOVES ({moves.length})
          </button>
        </div>
      </div>

      {/* Dynamic Daily Progress Indicator (Circular & Horizontal Hybrid) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0b0c1e] border border-cyan-500/20 relative overflow-hidden shadow-[0_10px_35px_-15px_rgba(6,182,212,0.15)]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                TODAY&apos;S PROGRESS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                {dailyState.streakDays} DAY STREAK
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              <span>{completedEssentialsCount} / 7 MOVES COMPLETE</span>
              <span className="text-xs text-zinc-400 font-normal">({progressPercent}%)</span>
            </div>

            <p className="text-xs text-[#D4AF37] font-mono font-medium">
              {getMotivationalText()}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onStartFocusSession?.(null, 15)}
              className="py-2 px-3.5 rounded-full bg-[#101025] hover:bg-white/10 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>FLOW SANCTUARY</span>
            </button>

            {completedEssentialsCount === 7 && (
              <button
                type="button"
                onClick={() => setIsDayCompleteModalOpen(true)}
                className="py-2 px-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                <span>VIEW DAY SUMMARY</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar with Cyan-to-Gold Flow */}
        <div className="mt-5 space-y-2">
          <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, progressPercent)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-[#D4AF37] shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>SMALL ACTIONS</span>
            <span>CONSISTENCY</span>
            <span>PROGRESS</span>
            <span className="text-[#D4AF37] font-semibold">BECOMING</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: DAILY ESSENTIALS (HERO INTERACTION) */}
      {activeView === "essentials" && (
        <div className="space-y-8">
          {/* Universal Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Move at your own level. Warm up before exercise, use controlled technique, stay hydrated, and stop if you feel pain, dizziness, or unwell. If you are unsure whether an activity is suitable for you, speak with a parent/guardian or qualified health professional.
            </p>
          </div>

          {/* 1. DAILY MOVE (HERO WORKOUT MODULE) */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-semibold">
                  HERO INTERACTION · 3-DAY TRAINING / 1-DAY RECOVERY CYCLE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  DAILY MOVE
                </h2>
                <p className="text-xs text-[#D4AF37] font-mono font-semibold uppercase tracking-wider mt-0.5">
                  &ldquo;Move with purpose.&rdquo;
                </p>
              </div>

              {/* Training Cycle Day Selector */}
              <div className="flex items-center gap-1 bg-[#101025] p-1 rounded-2xl border border-white/10 text-xs">
                {([1, 2, 3, 4] as TrainingCycleDay[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectCycleDay(day)}
                    className={`py-1.5 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      dailyState.cycleDay === day
                        ? day === 4
                          ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {day === 4 ? "DAY 4 (RECOVERY)" : `DAY ${day}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Day Phase Banner */}
            <div className="p-4 rounded-2xl bg-[#0b0c1e] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-300">
                  {currentProgramDay.title}
                </div>
                <p className="text-xs text-zinc-300 font-light mt-0.5">
                  {currentProgramDay.tagline}
                </p>
              </div>

              {!currentProgramDay.isRecoveryDay && (
                <button
                  type="button"
                  onClick={() => setIsWarmupOpen(true)}
                  className="py-2 px-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {dailyState.workout.warmupCompleted ? "WARM-UP COMPLETE" : "START WARM-UP (PREPARE)"}
                  </span>
                </button>
              )}
            </div>

            {/* Workout Exercises Grid (Day 1, 2, 3) or Recovery Activities (Day 4) */}
            {!currentProgramDay.isRecoveryDay ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentProgramDay.exercises.map((exercise, idx) => (
                    <ExerciseDemonstrationCard
                      key={exercise.id}
                      exercise={exercise}
                      exerciseIndex={idx}
                      totalExercises={currentProgramDay.exercises.length}
                      isCompleted={dailyState.workout.completedExerciseIds.includes(exercise.id)}
                      onCompleteExercise={handleCompleteExercise}
                    />
                  ))}
                </div>

                {/* Speed Drill Section */}
                {currentProgramDay.speedDrill && (
                  <SpeedDrillCard
                    drill={currentProgramDay.speedDrill}
                    isRecoveryDay={false}
                    isCompleted={dailyState.workout.speedCompleted}
                    onCompleteDrill={handleCompleteSpeedDrill}
                    onOpenWarmup={() => setIsWarmupOpen(true)}
                  />
                )}
              </div>
            ) : (
              /* Day 4 Recovery Protocol */
              <div className="rounded-3xl border border-emerald-500/30 bg-[#0b0c1e] p-6 space-y-5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Moon className="w-4 h-4" />
                  <span>RECOVERY DAY · RECOVERY IS PART OF PROGRESS</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    No Required Workout. No Sprint Required.
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    Your body adapts, repairs muscle fibers, and consolidates motor patterns during recovery. Today is not counted as a missed day—it actively protects your streak.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentProgramDay.recoverySuggestions?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-emerald-300 font-semibold">
                        <span>{item.title}</span>
                        <span className="font-mono text-[10px] text-zinc-400">{item.duration}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleRecordRecovery("Day 4 Active Recovery")}
                    disabled={dailyState.completedEssentials.move}
                    className={`py-2.5 px-6 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                      dailyState.completedEssentials.move
                        ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                    }`}
                  >
                    {dailyState.completedEssentials.move ? "RECOVERY DAY RECORDED" : "COMPLETE RECOVERY DAY"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 2. HYDRATE */}
          <section>
            <HydrateCard
              breaksCount={dailyState.hydrationBreaksCount}
              isCompleted={dailyState.completedEssentials.hydrate}
              onLogWaterBreak={handleLogWaterBreak}
            />
          </section>

          {/* 3. REST AND RECOVERY */}
          <section>
            <RecoveryCard
              isRecoveryDay={dailyState.cycleDay === 4}
              isCompleted={dailyState.completedEssentials.rest}
              onRecordRecovery={handleRecordRecovery}
            />
          </section>

          {/* 4. FOCUS */}
          <section>
            <FocusCard
              isCompleted={dailyState.completedEssentials.focus}
              minutesCompleted={dailyState.focusMinutesCompleted}
              onStartFocusSession={(duration) => onStartFocusSession?.(null, duration)}
              onMarkFocusComplete={handleMarkFocusComplete}
            />
          </section>

          {/* 5. LEARN */}
          <section>
            <LearnCard
              isCompleted={dailyState.completedEssentials.learn}
              onCompleteLearn={handleCompleteLearn}
            />
          </section>

          {/* 6. RESET */}
          <section>
            <ResetCard
              isCompleted={dailyState.completedEssentials.reset}
              onCompleteReset={handleCompleteReset}
            />
          </section>

          {/* 7. CONNECT */}
          <section>
            <ConnectCard
              isCompleted={dailyState.completedEssentials.connect}
              onRecordConnect={handleRecordConnect}
            />
          </section>
        </div>
      )}

      {/* VIEW 2: SAVED CUSTOM MOVES (FULL PRESERVATION OF USER MOVES) */}
      {activeView === "saved" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-[#101025] p-1 rounded-2xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({moves.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
                  filter === "active"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Active ({moves.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("completed")}
                className={`py-1.5 px-3 rounded-xl font-medium transition-all cursor-pointer ${
                  filter === "completed"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Done ({completedCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Domain Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-[#101025] border border-white/15 rounded-xl text-xs text-zinc-300 py-1.5 px-3 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Dimensions</option>
                  {CRESCIVE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Move Buttons */}
              <button
                type="button"
                id="btn-explore-ideas-header"
                onClick={() => onOpenCreateMove("ideas")}
                className="py-2 px-3 rounded-xl bg-[#101025] hover:bg-white/10 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Ideas</span>
              </button>

              <button
                type="button"
                id="btn-create-move-header"
                onClick={() => onOpenCreateMove("create")}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Create</span>
              </button>
            </div>
          </div>

          {/* List of Moves & Empty State */}
          {filteredMoves.length === 0 ? (
            <div className="py-16 px-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/30 text-center flex flex-col items-center shadow-[0_15px_40px_-15px_rgba(212,175,55,0.15)]">
              <div className="w-14 h-14 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              </div>

              {moves.length === 0 ? (
                <div className="flex flex-col items-center max-w-md">
                  <h3 className="text-xl font-light font-serif-cresive text-white tracking-wide">
                    &ldquo;Nothing moving yet.&rdquo;
                  </h3>
                  <p className="text-xs text-[#D4AF37] font-semibold mt-1 mb-6 uppercase tracking-wider font-mono">
                    Not sure what to start with?
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenCreateMove("create")}
                      className="py-3 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Create a Move</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCreateMove("ideas")}
                      className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Explore Move Ideas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-semibold text-white">No moves match your filter.</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">
                    Try switching filters or dimensions to view all your recorded moves.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMoves.map((move) => (
                <motion.div
                  key={move.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    move.completed
                      ? "bg-[#050510]/50 border-white/5 opacity-65"
                      : "bg-[#101025] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleMove(move.id)}
                    className="flex items-start gap-3.5 text-left flex-1 min-w-0 cursor-pointer pt-0.5"
                  >
                    <div className="shrink-0 mt-0.5">
                      {move.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-500 hover:text-[#D4AF37] transition-colors" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm sm:text-base font-bold tracking-wide ${
                          move.completed ? "line-through text-zinc-500" : "text-white"
                        }`}
                      >
                        {move.title}
                      </h4>

                      {move.notes && (
                        <p className="text-xs text-zinc-400 mt-1 font-light italic leading-relaxed">
                          &ldquo;{move.notes}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#050510] border border-[#D4AF37]/30 text-[#D4AF37] font-semibold flex items-center gap-1 font-mono">
                          <Tag className="w-2.5 h-2.5 text-[#D4AF37]" />
                          {move.domain}
                        </span>

                        <span className="text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                          {move.timeCommitment}
                        </span>

                        {move.scheduledTime && (
                          <span className="text-zinc-300 flex items-center gap-1 font-mono text-[10px]">
                            <Calendar className="w-2.5 h-2.5 text-[#D4AF37]" />
                            {move.scheduledDate || "Today"} {move.scheduledTime}
                          </span>
                        )}

                        {move.googleCalendarEventId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (move.googleCalendarHtmlLink) {
                                window.open(move.googleCalendarHtmlLink, "_blank", "noopener,noreferrer");
                              }
                            }}
                            className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center gap-1 text-[10px] font-mono font-semibold hover:bg-[#D4AF37]/25 transition-all cursor-pointer"
                            title="Synced to Google Calendar"
                          >
                            <Calendar className="w-2.5 h-2.5 text-[#D4AF37]" />
                            <span>Google Calendar</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}

                        {move.androidAlarmSet && (
                          <span
                            className="px-2 py-0.5 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/40 text-[#06b6d4] flex items-center gap-1 text-[10px] font-mono font-semibold"
                            title="Configured on Device Alarm Clock"
                          >
                            <Smartphone className="w-2.5 h-2.5 text-[#06b6d4]" />
                            <span>Device Alarm {move.androidAlarmTime || ""}</span>
                          </span>
                        )}

                        {move.reminderEnabled && !move.androidAlarmSet && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 flex items-center gap-1 text-[10px] font-mono">
                            <Bell className="w-2.5 h-2.5" />
                            <span>Alert</span>
                          </span>
                        )}

                        {move.completed && move.completedAt && (
                          <span className="text-emerald-400 font-mono text-[10px]">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!move.completed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartFocusSession?.(move);
                        }}
                        className="py-1.5 px-3 rounded-full bg-[#050510] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Enter Deep Work Sanctuary for this Move"
                      >
                        <Play className="w-3 h-3 fill-current text-[#D4AF37]" />
                        <span>Focus</span>
                      </button>
                    )}

                    {onEditMove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMove(move);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                        title="Edit Move & Schedule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(move);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Move"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warm-Up (PREPARE) Modal */}
      <WarmupModal
        isOpen={isWarmupOpen}
        onClose={() => setIsWarmupOpen(false)}
        onWarmupFinished={handleWarmupFinished}
      />

      {/* Day Complete Modal */}
      <DayCompleteModal
        isOpen={isDayCompleteModalOpen}
        onClose={() => setIsDayCompleteModalOpen(false)}
        state={dailyState}
      />

      {/* Confirmation Modal for Deleting Move with linked Google Calendar event */}
      <AnimatePresence>
        {movePendingDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#101025] border border-[#D4AF37]/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-white">Delete Linked Calendar Move?</h3>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  &ldquo;{movePendingDelete.title}&rdquo; is synchronized with your Google Calendar.
                  How would you like to handle this calendar event?
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDeleteBoth}
                  disabled={isDeletingCalendarEvent}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isDeletingCalendarEvent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing from Google Calendar...</span>
                    </>
                  ) : (
                    <span>Delete Everywhere (CRESCIVE & Calendar)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteLocalOnly}
                  disabled={isDeletingCalendarEvent}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Delete from CRESCIVE only (Keep on Calendar)
                </button>

                <button
                  type="button"
                  onClick={() => setMovePendingDelete(null)}
                  disabled={isDeletingCalendarEvent}
                  className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
