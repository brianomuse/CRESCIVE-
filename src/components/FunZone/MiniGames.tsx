import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Brain,
  Hash,
  Type,
  HelpCircle,
  Zap,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { FunZoneState } from "../../types";
import {
  QUIZ_QUESTIONS,
  SCRAMBLE_WORDS,
  RIDDLES,
} from "../../data/funZoneData";
import {
  recordFunActivity,
  updateBestTapScore,
} from "../../utils/funZoneStorage";
import { playCresciveChime, triggerVibration } from "../../utils/reminderEngine";

interface MiniGamesProps {
  funState: FunZoneState;
  onUpdateFunState: (newState: FunZoneState) => void;
  onToast: (msg: string) => void;
  onBack: () => void;
}

type ActiveGame = "menu" | "quiz" | "number" | "scramble" | "riddle" | "tap";

export const MiniGames: React.FC<MiniGamesProps> = ({
  funState,
  onUpdateFunState,
  onToast,
  onBack,
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>("menu");

  // ==================== 1. QUICK QUIZ STATE ====================
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const currentQuiz = QUIZ_QUESTIONS[quizIndex % QUIZ_QUESTIONS.length];

  const handleAnswerQuiz = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);

    const isCorrect = index === currentQuiz.correctIndex;
    if (isCorrect) {
      playCresciveChime();
      setQuizScore((prev) => prev + 1);
      setQuizFeedback("🎉 Correct! +10 XP");
      const res = recordFunActivity(funState, 10, "quiz");
      onUpdateFunState(res.updatedState);
      onToast("🎉 Correct answer! +10 XP");
    } else {
      triggerVibration();
      const correctAnswerText = currentQuiz.options[currentQuiz.correctIndex];
      setQuizFeedback(`😅 Not quite! The answer was: ${correctAnswerText}`);
      const res = recordFunActivity(funState, 0, "game");
      onUpdateFunState(res.updatedState);
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setQuizFeedback(null);
    setQuizIndex((prev) => prev + 1);
  };

  // ==================== 2. NUMBER GUESS STATE ====================
  const [targetNumber, setTargetNumber] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [userGuess, setUserGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);
  const [guessAttempts, setGuessAttempts] = useState(0);
  const [isNumberWon, setIsNumberWon] = useState(false);

  const handleGuessSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(userGuess.trim(), 10);
    if (isNaN(val) || val < 1 || val > 100) {
      onToast("Please enter a valid number between 1 and 100");
      return;
    }

    const nextAttempts = guessAttempts + 1;
    setGuessAttempts(nextAttempts);

    if (val === targetNumber) {
      setIsNumberWon(true);
      playCresciveChime();
      // Bonus: fewer attempts gives more satisfaction
      const earnedXp = nextAttempts <= 5 ? 25 : 20;
      setGuessFeedback(`🎉 You got it in ${nextAttempts} attempts! +${earnedXp} XP`);
      const res = recordFunActivity(funState, earnedXp, "game");
      onUpdateFunState(res.updatedState);
      onToast(`🎉 Secret Number Found! +${earnedXp} XP`);
    } else if (val < targetNumber) {
      setGuessFeedback("⬆️ Too low! Try a higher number.");
      triggerVibration();
    } else {
      setGuessFeedback("⬇️ Too high! Try a lower number.");
      triggerVibration();
    }
    setUserGuess("");
  };

  const handleResetNumberGame = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setUserGuess("");
    setGuessFeedback(null);
    setGuessAttempts(0);
    setIsNumberWon(false);
  };

  // ==================== 3. WORD SCRAMBLE STATE ====================
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [scrambleFeedback, setScrambleFeedback] = useState<string | null>(null);
  const [showScrambleHint, setShowScrambleHint] = useState(false);
  const [isScrambleWon, setIsScrambleWon] = useState(false);

  const currentScramble = SCRAMBLE_WORDS[scrambleIndex % SCRAMBLE_WORDS.length];

  const handleScrambleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scrambleGuess.trim()) return;

    if (scrambleGuess.trim().toUpperCase() === currentScramble.word.toUpperCase()) {
      setIsScrambleWon(true);
      playCresciveChime();
      setScrambleFeedback(`🎉 Awesome! That is ${currentScramble.word} ${currentScramble.emoji} +15 XP`);
      const res = recordFunActivity(funState, 15, "game");
      onUpdateFunState(res.updatedState);
      onToast("🎉 Word Scramble Solved! +15 XP");
    } else {
      triggerVibration();
      setScrambleFeedback("😅 Not quite right! Give it another shot.");
    }
  };

  const handleNextScramble = () => {
    setScrambleIndex((prev) => prev + 1);
    setScrambleGuess("");
    setScrambleFeedback(null);
    setShowScrambleHint(false);
    setIsScrambleWon(false);
  };

  // ==================== 4. RIDDLE RUSH STATE ====================
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [selectedRiddleOption, setSelectedRiddleOption] = useState<number | null>(null);
  const [riddleFeedback, setRiddleFeedback] = useState<string | null>(null);
  const [showRiddleHint, setShowRiddleHint] = useState(false);

  const currentRiddle = RIDDLES[riddleIndex % RIDDLES.length];

  const handleAnswerRiddle = (optIndex: number) => {
    if (selectedRiddleOption !== null) return;
    setSelectedRiddleOption(optIndex);

    if (optIndex === currentRiddle.correctIndex) {
      playCresciveChime();
      setRiddleFeedback("🎉 Riddle Solved! +15 XP");
      const res = recordFunActivity(funState, 15, "riddle");
      onUpdateFunState(res.updatedState);
      onToast("🎉 Riddle Solved! +15 XP");
    } else {
      triggerVibration();
      const correctAns = currentRiddle.options[currentRiddle.correctIndex];
      setRiddleFeedback(`😅 Nice try! The answer is: ${correctAns}`);
      const res = recordFunActivity(funState, 0, "game");
      onUpdateFunState(res.updatedState);
    }
  };

  const handleNextRiddle = () => {
    setSelectedRiddleOption(null);
    setRiddleFeedback(null);
    setShowRiddleHint(false);
    setRiddleIndex((prev) => prev + 1);
  };

  // ==================== 5. TAP CHALLENGE STATE ====================
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeLeft, setTapTimeLeft] = useState(10);
  const [isTapActive, setIsTapActive] = useState(false);
  const [isTapFinished, setIsTapFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTapActive && tapTimeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTapTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTapActive && tapTimeLeft === 0) {
      setIsTapActive(false);
      setIsTapFinished(true);

      const xpEarned = Math.min(tapCount, 50); // 1 XP per tap capped at 50
      playCresciveChime();

      // Update best tap score
      const stateWithScore = updateBestTapScore(funState, tapCount);
      const res = recordFunActivity(stateWithScore, xpEarned, "tap");
      onUpdateFunState(res.updatedState);
      onToast(`⚡ Speed Tapping Complete! ${tapCount} taps (+${xpEarned} XP)`);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTapActive, tapTimeLeft, tapCount]);

  const handleStartTapChallenge = () => {
    setTapCount(0);
    setTapTimeLeft(10);
    setIsTapFinished(false);
    setIsTapActive(true);
  };

  const handleTapButton = () => {
    if (!isTapActive) {
      handleStartTapChallenge();
      setTapCount(1);
      return;
    }
    setTapCount((prev) => prev + 1);
  };

  // ==================== RENDER GAME SELECTION MENU ====================
  if (activeGame === "menu") {
    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101025] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Fun Zone</span>
          </button>

          <span className="text-xs font-mono text-[#D4AF37]">5 Mini Games</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Game 1: Quick Quiz */}
          <div
            onClick={() => setActiveGame("quiz")}
            className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 hover:border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center">
                <Brain className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-mono text-[10px] font-bold">
                +10 XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-serif-cresive">
              Quick Quiz
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Test your general knowledge with fast 4-choice trivia questions.
            </p>
          </div>

          {/* Game 2: Number Guess */}
          <div
            onClick={() => setActiveGame("number")}
            className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 hover:border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center">
                <Hash className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 font-mono text-[10px] font-bold">
                +20 XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-serif-cresive">
              Number Guess
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Guess the secret number between 1 and 100 with hot &amp; cold clues.
            </p>
          </div>

          {/* Game 3: Word Scramble */}
          <div
            onClick={() => setActiveGame("scramble")}
            className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 hover:border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-cyan-700/20 border border-cyan-500/30 flex items-center justify-center">
                <Type className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 font-mono text-[10px] font-bold">
                +15 XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-serif-cresive">
              Word Scramble
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Unscramble jumbled letters and discover the hidden word.
            </p>
          </div>

          {/* Game 4: Riddle Rush */}
          <div
            onClick={() => setActiveGame("riddle")}
            className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 hover:border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-purple-700/20 border border-purple-500/30 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-400 font-mono text-[10px] font-bold">
                +15 XP
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-serif-cresive">
              Riddle Rush
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Solve clever mind-benders with multiple choice and hints.
            </p>
          </div>

          {/* Game 5: Tap Challenge */}
          <div
            onClick={() => setActiveGame("tap")}
            className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 hover:border-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group sm:col-span-2"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-rose-700/20 border border-rose-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-400/15 text-rose-400 font-mono text-[10px] font-bold">
                1 XP / Tap
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-serif-cresive">
              ⚡ Tap Challenge (10s)
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Fast reflex tapping: test how many taps you can achieve in 10 seconds!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE GAME RENDERS ====================
  return (
    <div className="space-y-4 pb-16">
      {/* Game Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveGame("menu")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101025] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Games</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
          {activeGame === "quiz" && `Question #${quizIndex + 1}`}
          {activeGame === "number" && `Attempts: ${guessAttempts}`}
          {activeGame === "scramble" && `Word #${scrambleIndex + 1}`}
          {activeGame === "riddle" && `Riddle #${riddleIndex + 1}`}
          {activeGame === "tap" && `Best: ${funState.bestTapScore}`}
        </div>
      </div>

      {/* GAME 1: QUICK QUIZ */}
      {activeGame === "quiz" && (
        <motion.div
          key={currentQuiz.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-5"
        >
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
              Quick Quiz
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Score: <strong className="text-[#D4AF37]">{quizScore}</strong>
            </span>
          </div>

          <h3 className="text-lg font-bold text-white leading-relaxed">
            {currentQuiz.question}
          </h3>

          {/* 4 Choices */}
          <div className="space-y-2.5">
            {currentQuiz.options.map((opt, idx) => {
              let btnStyle = "bg-[#070716] border-white/10 hover:border-[#D4AF37]/50 text-zinc-200";

              if (selectedAnswer !== null) {
                if (idx === currentQuiz.correctIndex) {
                  btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                } else if (idx === selectedAnswer) {
                  btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200";
                } else {
                  btnStyle = "bg-[#070716] border-white/5 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerQuiz(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-3.5 rounded-2xl border text-left font-medium text-sm flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {selectedAnswer !== null && idx === currentQuiz.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {selectedAnswer !== null && idx === selectedAnswer && idx !== currentQuiz.correctIndex && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {quizFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-3 border-t border-white/10 space-y-3"
            >
              <p className="text-sm font-semibold text-white">{quizFeedback}</p>
              {currentQuiz.explanation && (
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  💡 {currentQuiz.explanation}
                </p>
              )}
              <button
                onClick={handleNextQuiz}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Next Question →
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* GAME 2: NUMBER GUESS */}
      {activeGame === "number" && (
        <div className="p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
              Secret Number: 1–100
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Attempts: <strong className="text-[#D4AF37]">{guessAttempts}</strong>
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-mono font-bold text-[#D4AF37] tracking-widest">
              {isNumberWon ? targetNumber : "???"}
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-light">
              I have chosen a secret number between 1 and 100.
            </p>
          </div>

          {!isNumberWon ? (
            <form onSubmit={handleGuessSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  placeholder="Enter 1–100..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#070716] border border-white/15 text-white font-mono text-center text-lg focus:border-[#D4AF37] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Guess
                </button>
              </div>

              {guessFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-sm font-semibold text-white"
                >
                  {guessFeedback}
                </motion.div>
              )}
            </form>
          ) : (
            <div className="text-center space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 font-medium text-sm">
                {guessFeedback}
              </div>
              <button
                onClick={handleResetNumberGame}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 3: WORD SCRAMBLE */}
      {activeGame === "scramble" && (
        <div className="p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase tracking-wider">
              Word Scramble
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Length: {currentScramble.word.length} letters
            </span>
          </div>

          <div className="text-center py-3">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#D4AF37] tracking-[0.25em] uppercase">
              {currentScramble.scrambled}
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-light">
              Rearrange the letters to form the correct word.
            </p>
          </div>

          {/* Hint button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowScrambleHint(!showScrambleHint)}
              className="text-xs text-zinc-400 hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showScrambleHint ? currentScramble.hint : "Show Hint"}</span>
            </button>
          </div>

          {!isScrambleWon ? (
            <form onSubmit={handleScrambleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scrambleGuess}
                  onChange={(e) => setScrambleGuess(e.target.value.toUpperCase())}
                  placeholder="Type your word..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#070716] border border-white/15 text-white font-mono text-center text-lg uppercase tracking-wider focus:border-[#D4AF37] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Submit
                </button>
              </div>

              {scrambleFeedback && (
                <p className="text-center text-xs font-semibold text-rose-300">
                  {scrambleFeedback}
                </p>
              )}
            </form>
          ) : (
            <div className="text-center space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 font-medium text-sm">
                {scrambleFeedback}
              </div>
              <button
                onClick={handleNextScramble}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Next Scramble →
              </button>
            </div>
          )}
        </div>
      )}

      {/* GAME 4: RIDDLE RUSH */}
      {activeGame === "riddle" && (
        <div className="p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono uppercase tracking-wider">
              Riddle Rush
            </span>
            <button
              onClick={() => setShowRiddleHint(!showRiddleHint)}
              className="text-xs text-zinc-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Hint</span>
            </button>
          </div>

          <h3 className="text-lg font-serif-cresive font-medium text-white leading-relaxed">
            &ldquo;{currentRiddle.riddle}&rdquo;
          </h3>

          {showRiddleHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 font-light"
            >
              💡 Hint: {currentRiddle.hint}
            </motion.div>
          )}

          {/* Options */}
          <div className="space-y-2.5">
            {currentRiddle.options.map((opt, idx) => {
              let btnStyle = "bg-[#070716] border-white/10 hover:border-purple-500/50 text-zinc-200";

              if (selectedRiddleOption !== null) {
                if (idx === currentRiddle.correctIndex) {
                  btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200";
                } else if (idx === selectedRiddleOption) {
                  btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200";
                } else {
                  btnStyle = "bg-[#070716] border-white/5 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerRiddle(idx)}
                  disabled={selectedRiddleOption !== null}
                  className={`w-full p-3.5 rounded-2xl border text-left font-medium text-sm flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {selectedRiddleOption !== null && idx === currentRiddle.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {riddleFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-3 border-t border-white/10 space-y-3"
            >
              <p className="text-sm font-semibold text-white">{riddleFeedback}</p>
              <button
                onClick={handleNextRiddle}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Next Riddle →
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* GAME 5: TAP CHALLENGE */}
      {activeGame === "tap" && (
        <div className="p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/35 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-5 text-center">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase tracking-wider">
              10s Speed Tap
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Time: <strong className="text-rose-400 text-sm">{tapTimeLeft}s</strong>
            </span>
          </div>

          <div className="py-2">
            <div className="text-5xl sm:text-6xl font-mono font-extrabold text-[#D4AF37]">
              {tapCount}
            </div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1 font-mono">
              Taps Counted
            </p>
          </div>

          {!isTapFinished ? (
            <div className="py-4 flex justify-center">
              <button
                onClick={handleTapButton}
                className="w-44 h-44 rounded-full bg-gradient-to-tr from-[#D4AF37] via-amber-400 to-[#B8860B] text-black font-black text-xl tracking-wider uppercase shadow-[0_0_50px_rgba(212,175,55,0.4)] active:scale-90 hover:scale-105 transition-transform flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <Zap className="w-9 h-9 stroke-[2.5]" />
                <span className="text-sm font-extrabold mt-1">
                  {isTapActive ? "TAP TAP TAP!" : "TAP TO START"}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#D4AF37]/20 to-[#101025] border border-[#D4AF37]/40 text-center">
                <h4 className="text-lg font-bold text-white font-serif-cresive">
                  Time&apos;s Up!
                </h4>
                <p className="text-xs text-[#D4AF37] font-mono mt-1">
                  Taps: <strong>{tapCount}</strong> · XP Earned:{" "}
                  <strong>+{Math.min(tapCount, 50)} XP</strong>
                </p>
                {tapCount > funState.bestTapScore && (
                  <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    New Personal Best!
                  </p>
                )}
              </div>

              <button
                onClick={handleStartTapChallenge}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tap Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
