import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  Brain,
  Smile,
  Gamepad2,
  Lightbulb,
  Zap,
  ArrowRight,
  Trophy,
  RotateCcw,
  Check,
  AlertCircle
} from "lucide-react";
import { CresciveDailyState, DailyChallengeItem, DailyTipItem, Joke } from "../../types";
import {
  getDailyChallengeForDate,
  getDailyJokeForDate,
  getDailyTipForDate,
  getDailyGameTypeForDate,
} from "../../data/cresciveDailyData";
import { SCRAMBLE_WORDS, RIDDLES } from "../../data/funZoneData";
import { completeDailyActivity } from "../../utils/cresciveDailyStorage";
import { playCresciveChime, triggerVibration } from "../../utils/reminderEngine";

interface CresciveDailyModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyState: CresciveDailyState;
  onStateChange: (newState: CresciveDailyState) => void;
  onNavigateTab?: (tab: "home" | "moves" | "fun" | "categories" | "future" | "navigator" | "profile") => void;
}

export const CresciveDailyModal: React.FC<CresciveDailyModalProps> = ({
  isOpen,
  onClose,
  dailyState,
  onStateChange,
  onNavigateTab,
}) => {
  // Active sub-activity in modal ("overview" | "challenge" | "joke" | "minigame" | "tip" | "results")
  const [activeView, setActiveView] = useState<"overview" | "challenge" | "joke" | "minigame" | "tip" | "results">("overview");

  // XP animation toast inside modal
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);

  // Today's loaded data
  const challenge: DailyChallengeItem = useMemo(
    () => getDailyChallengeForDate(dailyState.date),
    [dailyState.date]
  );
  const joke: Joke = useMemo(
    () => getDailyJokeForDate(dailyState.date),
    [dailyState.date]
  );
  const tip: DailyTipItem = useMemo(
    () => getDailyTipForDate(dailyState.date),
    [dailyState.date]
  );
  const gameType = useMemo(
    () => getDailyGameTypeForDate(dailyState.date),
    [dailyState.date]
  );

  // Quick challenge state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState<boolean>(false);

  // Joke state
  const [showPunchline, setShowPunchline] = useState<boolean>(false);

  // Mini-game state
  // Scramble game
  const todayScramble = useMemo(() => {
    const dayNum = parseInt(dailyState.date.replace(/-/g, ""), 10) || 1;
    return SCRAMBLE_WORDS[dayNum % SCRAMBLE_WORDS.length];
  }, [dailyState.date]);
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [scrambleFeedback, setScrambleFeedback] = useState<string | null>(null);

  // Riddle game
  const todayRiddle = useMemo(() => {
    const dayNum = parseInt(dailyState.date.replace(/-/g, ""), 10) || 1;
    return RIDDLES[dayNum % RIDDLES.length];
  }, [dailyState.date]);
  const [riddleChoice, setRiddleChoice] = useState<number | null>(null);

  // Tap game
  const [tapCount, setTapCount] = useState(0);
  const [tapActive, setTapActive] = useState(false);
  const [tapSecondsLeft, setTapSecondsLeft] = useState(10);

  const completedCount = Object.values(dailyState.completed).filter(Boolean).length;
  const isAllComplete = completedCount === 4;

  const triggerXpNotification = (amount: number, label: string) => {
    playCresciveChime();
    triggerVibration(80);
    setXpToast({ amount, message: label });
    setTimeout(() => {
      setXpToast(null);
    }, 2800);
  };

  // Handler for completing an activity
  const handleMarkComplete = (activity: "challenge" | "joke" | "miniGame" | "tip") => {
    if (dailyState.completed[activity]) return;

    const res = completeDailyActivity(activity);
    onStateChange(res.state);

    if (res.allCompletedNow) {
      triggerXpNotification(res.xpGained, "🎉 All Daily Moves Complete! +20 Bonus XP!");
    } else if (res.xpGained > 0) {
      triggerXpNotification(res.xpGained, `+${res.xpGained} XP Earned!`);
    }
  };

  // Handle Quick Challenge option select
  const handleAnswerChallenge = (index: number) => {
    if (challengeSubmitted || dailyState.completed.challenge) return;
    setSelectedOption(index);
    setChallengeSubmitted(true);

    if (index === challenge.correctIndex) {
      handleMarkComplete("challenge");
    } else {
      triggerVibration(100);
    }
  };

  // Handle Joke reveal
  const handleRevealJoke = () => {
    setShowPunchline(true);
    if (!dailyState.completed.joke) {
      handleMarkComplete("joke");
    }
  };

  // Handle Scramble guess
  const handleCheckScramble = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (dailyState.completed.miniGame) return;

    if (scrambleGuess.trim().toLowerCase() === todayScramble.word.toLowerCase()) {
      setScrambleFeedback("correct");
      handleMarkComplete("miniGame");
    } else {
      setScrambleFeedback("wrong");
      triggerVibration(80);
      setTimeout(() => setScrambleFeedback(null), 2000);
    }
  };

  // Handle Riddle choice
  const handleAnswerRiddle = (idx: number) => {
    if (dailyState.completed.miniGame) return;
    setRiddleChoice(idx);
    if (idx === todayRiddle.correctIndex) {
      handleMarkComplete("miniGame");
    } else {
      triggerVibration(80);
    }
  };

  // Handle Tap Game click
  const handleSpeedTap = () => {
    if (dailyState.completed.miniGame) return;
    if (!tapActive && tapCount === 0) {
      setTapActive(true);
      const timer = setInterval(() => {
        setTapSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTapActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= 10) {
      handleMarkComplete("miniGame");
      setTapActive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl my-6 bg-gradient-to-b from-[#141228] via-[#0E0C20] to-[#080714] border border-[#D4AF37]/40 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top XP Toast */}
        <AnimatePresence>
          {xpToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFF1C5] text-black font-bold text-xs tracking-wider shadow-2xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{xpToast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#121026]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <div className="w-full h-full rounded-2xl bg-[#0B0C16] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif-cresive text-white tracking-wide">
                  CRESCIVE DAILY
                </h2>
                {dailyState.streak > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {dailyState.streak} DAY STREAK
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Today&apos;s Moves:{" "}
                <span className="text-[#D4AF37] font-bold">
                  {completedCount}/4
                </span>
                {isAllComplete && (
                  <span className="text-emerald-400 ml-1.5 font-semibold">· All Complete! 🎉</span>
                )}
              </p>
            </div>
          </div>

          <button
            id="btn-close-crescive-daily"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/10 shrink-0 overflow-hidden">
          <motion.div
            className={`h-full ${
              isAllComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-[#D4AF37] to-[#FFF1C5]"
            }`}
            animate={{ width: `${(completedCount / 4) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Main Navigation Tabs within Daily Modal */}
          {activeView === "overview" && (
            <div className="space-y-4">
              {/* Full completion banner if done */}
              {isAllComplete ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#101025] to-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
                  <div className="text-3xl">🎉</div>
                  <h3 className="text-lg font-bold font-serif-cresive text-white">
                    DAILY MOVES COMPLETE!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Great job! You completed today&apos;s CRESCIVE Daily Moves. Come back tomorrow for a new challenge!
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono">
                    <span className="text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      ✓ +50 XP Awarded
                    </span>
                    <span className="text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {dailyState.streak} Day Streak
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveView("results")}
                      className="text-xs text-[#D4AF37] hover:underline font-semibold cursor-pointer"
                    >
                      View Detailed Today&apos;s Results →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white font-serif-cresive">
                      Do Your Daily Moves 🚀
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tap each activity below to finish today&apos;s set and claim 50 XP!
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-[#D4AF37]">
                    <div>{completedCount}/4 Done</div>
                  </div>
                </div>
              )}

              {/* 4 Activities List */}
              <div className="space-y-3">
                {/* 1. Quick Challenge */}
                <div
                  onClick={() => setActiveView("challenge")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    dailyState.completed.challenge
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-80"
                      : "bg-white/[0.04] border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">1. Quick Challenge</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                          {challenge.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {challenge.question}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {dailyState.completed.challenge ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold">
                        +10 XP
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>

                {/* 2. Daily Joke */}
                <div
                  onClick={() => setActiveView("joke")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    dailyState.completed.joke
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-80"
                      : "bg-white/[0.04] border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Smile className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">2. Daily Joke</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                          {joke.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {joke.text}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {dailyState.completed.joke ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold">
                        +5 XP
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>

                {/* 3. Mini Game Move */}
                <div
                  onClick={() => setActiveView("minigame")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    dailyState.completed.miniGame
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-80"
                      : "bg-white/[0.04] border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">3. Mini Game Move</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                          {gameType === "scramble" ? "Word Scramble" : gameType === "tap" ? "Speed Tap" : "Riddle Rush"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        A quick mini-game activity from the arcade.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {dailyState.completed.miniGame ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold">
                        +10 XP
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>

                {/* 4. Daily Tip */}
                <div
                  onClick={() => setActiveView("tip")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    dailyState.completed.tip
                      ? "bg-emerald-950/20 border-emerald-500/30 opacity-80"
                      : "bg-white/[0.04] border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">4. Daily Tip</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                          {tip.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {tip.title}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {dailyState.completed.tip ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold">
                        +5 XP
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              </div>

              {/* View Results Button */}
              {isAllComplete && (
                <div className="pt-2">
                  <button
                    onClick={() => setActiveView("results")}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>VIEW TODAY&apos;S RESULTS</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW: 1. QUICK CHALLENGE */}
          {activeView === "challenge" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView("overview")}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Daily Moves
                </button>
                <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  {challenge.category} · +10 XP
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {challenge.question}
                </h3>

                {/* Multiple choice options */}
                <div className="space-y-2 pt-2">
                  {challenge.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === challenge.correctIndex;
                    const showResult = challengeSubmitted || dailyState.completed.challenge;

                    let btnStyle = "bg-white/[0.04] border-white/10 text-white hover:border-[#D4AF37]/40";
                    if (showResult) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold";
                      } else if (isSelected) {
                        btnStyle = "bg-red-500/20 border-red-500 text-red-200";
                      } else {
                        btnStyle = "bg-white/[0.02] border-white/5 text-zinc-500";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerChallenge(idx)}
                        disabled={showResult}
                        className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
                      >
                        <span>{opt}</span>
                        {showResult && isCorrect && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {(challengeSubmitted || dailyState.completed.challenge) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <Brain className="w-3.5 h-3.5" />
                      <span>EXPLANATION</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {challenge.explanation}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">
                  {dailyState.completed.challenge ? "✓ Completed for today" : "Choose the best answer to earn +10 XP"}
                </span>
                <button
                  onClick={() => setActiveView("overview")}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 2. DAILY JOKE */}
          {activeView === "joke" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView("overview")}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Daily Moves
                </button>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {joke.category} · +5 XP
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/20 via-[#101025] to-[#0A0B14] border border-amber-400/30 text-center space-y-5">
                <div className="text-4xl">{joke.emoji || "😂"}</div>

                <p className="text-base sm:text-lg font-medium text-white leading-relaxed whitespace-pre-line">
                  &ldquo;{joke.text}&rdquo;
                </p>

                {/* Reveal punchline */}
                {showPunchline || dailyState.completed.joke ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 font-bold text-base sm:text-lg"
                  >
                    🎉 &ldquo;{joke.punchline}&rdquo;
                  </motion.div>
                ) : (
                  <button
                    onClick={handleRevealJoke}
                    className="py-3 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Tap to Reveal Punchline 🎭
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">
                  {dailyState.completed.joke ? "✓ Joke unlocked (+5 XP earned)" : "Tap punchline to earn +5 XP"}
                </span>
                <button
                  onClick={() => setActiveView("overview")}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 3. MINI GAME MOVE */}
          {activeView === "minigame" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView("overview")}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Daily Moves
                </button>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Fun Zone Mini-Game · +10 XP
                </span>
              </div>

              {/* Game Mode 1: Word Scramble */}
              {gameType === "scramble" && (
                <div className="p-6 rounded-2xl bg-[#101025] border border-cyan-400/30 text-center space-y-4">
                  <div className="text-3xl">{todayScramble.emoji}</div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300">
                      UNSCRAMBLE THE WORD
                    </span>
                    <h3 className="text-3xl font-extrabold tracking-widest text-white font-mono my-2">
                      {todayScramble.scrambled}
                    </h3>
                    <p className="text-xs text-zinc-400 italic">
                      Hint: &ldquo;{todayScramble.hint}&rdquo;
                    </p>
                  </div>

                  {dailyState.completed.miniGame ? (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold">
                      ✓ Solved! The word was: {todayScramble.word.toUpperCase()} (+10 XP)
                    </div>
                  ) : (
                    <form onSubmit={handleCheckScramble} className="space-y-3 max-w-xs mx-auto">
                      <input
                        type="text"
                        value={scrambleGuess}
                        onChange={(e) => setScrambleGuess(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-center font-mono uppercase focus:border-cyan-400 focus:outline-none"
                      />
                      {scrambleFeedback === "wrong" && (
                        <p className="text-xs text-red-400 font-semibold">Not quite, try again!</p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Submit Word
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Game Mode 2: Speed Tap */}
              {gameType === "tap" && (
                <div className="p-6 rounded-2xl bg-[#101025] border border-cyan-400/30 text-center space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300">
                      10-TAP FOCUS CHALLENGE
                    </span>
                    <p className="text-xs text-zinc-300 mt-1">
                      Tap 10 times to complete today&apos;s mini-game move!
                    </p>
                  </div>

                  <div className="py-4">
                    <button
                      onClick={handleSpeedTap}
                      disabled={dailyState.completed.miniGame}
                      className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-4 border-cyan-300 text-white font-extrabold text-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 transition-transform flex flex-col items-center justify-center cursor-pointer"
                    >
                      <span>{tapCount}/10</span>
                      <span className="text-[10px] font-normal uppercase tracking-wider">TAP!</span>
                    </button>
                  </div>

                  {dailyState.completed.miniGame && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold">
                      ✓ Challenge complete! +10 XP awarded!
                    </div>
                  )}
                </div>
              )}

              {/* Game Mode 3: Riddle Rush */}
              {gameType === "riddle" && (
                <div className="p-6 rounded-2xl bg-[#101025] border border-cyan-400/30 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-300 block mb-1">
                      DAILY RIDDLE
                    </span>
                    <h3 className="text-base font-bold text-white">
                      &ldquo;{todayRiddle.riddle}&rdquo;
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {todayRiddle.options.map((opt, idx) => {
                      const isCorrect = idx === todayRiddle.correctIndex;
                      const isChosen = riddleChoice === idx;
                      const isDone = dailyState.completed.miniGame;

                      let btnStyle = "bg-white/[0.04] border-white/10 text-white";
                      if (isDone) {
                        if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                        else if (isChosen) btnStyle = "bg-red-500/20 border-red-500 text-red-300";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerRiddle(idx)}
                          disabled={isDone}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
                        >
                          <span>{opt}</span>
                          {isDone && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab("fun");
                    }}
                    className="text-xs text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Visit Fun Zone Arcade →</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveView("overview")}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer ml-auto"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 4. DAILY TIP */}
          {activeView === "tip" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView("overview")}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Daily Moves
                </button>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {tip.category} · +5 XP
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#101025] to-[#0A0B14] border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    {tip.tag}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold font-serif-cresive text-white">
                  {tip.title}
                </h3>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {tip.tip}
                </p>

                {tip.actionableStep && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                      TODAY&apos;S MICRO-ACTION:
                    </span>
                    <p className="text-xs text-white">
                      {tip.actionableStep}
                    </p>
                  </div>
                )}

                {!dailyState.completed.tip ? (
                  <button
                    onClick={() => handleMarkComplete("tip")}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Got it! Claim +5 XP 🚀
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    ✓ Completed &amp; claimed (+5 XP)
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">
                  {dailyState.completed.tip ? "✓ Completed for today" : "Read and claim +5 XP"}
                </span>
                <button
                  onClick={() => setActiveView("overview")}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 8. TODAY'S RESULTS SUMMARY */}
          {activeView === "results" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView("overview")}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Daily Overview
                </button>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  TODAY&apos;S RESULTS
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101025] via-[#101025] to-[#1a1235] border border-emerald-500/40 space-y-5 text-center shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="w-full h-full rounded-2xl bg-[#090A14] flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-emerald-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold font-serif-cresive text-white">
                    TODAY&apos;S RESULTS
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Awesome work! See you tomorrow. 🚀
                  </p>
                </div>

                {/* Checklist */}
                <div className="space-y-2.5 text-left max-w-sm mx-auto p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Quick Challenge
                    </span>
                    <span className="font-mono text-[#D4AF37] font-bold">+10 XP</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Daily Joke
                    </span>
                    <span className="font-mono text-[#D4AF37] font-bold">+5 XP</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Mini Game Move
                    </span>
                    <span className="font-mono text-[#D4AF37] font-bold">+10 XP</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Daily Tip
                    </span>
                    <span className="font-mono text-[#D4AF37] font-bold">+5 XP</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      All Moves Bonus
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">+20 XP</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                      Daily XP
                    </span>
                    <span className="text-lg font-bold text-[#F5D77F] font-mono">
                      +50 XP
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] font-mono text-amber-300 uppercase block">
                      Current Streak
                    </span>
                    <span className="text-lg font-bold text-amber-300 font-mono flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      {dailyState.streak} Days
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full max-w-sm py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer mx-auto"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
