import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoveItem } from "../../types";
import {
  Bell,
  Clock,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  Zap,
} from "lucide-react";

interface ActiveReminderModalProps {
  move: MoveItem | null;
  isOpen: boolean;
  onStartMove: (moveId: string) => void;
  onSnooze: (moveId: string, minutes: number) => void;
  onDismiss: (moveId: string) => void;
  onChangeScheduledTime: (moveId: string, newDate: string, newTime: string) => void;
  onStopReminder: (moveId: string) => void;
  onStartInFocusSanctuary?: (move: MoveItem) => void;
}

export const ActiveReminderModal: React.FC<ActiveReminderModalProps> = ({
  move,
  isOpen,
  onStartMove,
  onSnooze,
  onDismiss,
  onChangeScheduledTime,
  onStopReminder,
  onStartInFocusSanctuary,
}) => {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("15");
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  if (!isOpen || !move) return null;

  const isRepeatedlyPostponed = (move.snoozeCount || 0) >= 3;

  const handleCustomSnooze = () => {
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      onSnooze(move.id, mins);
      setShowSnoozeMenu(false);
    }
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && newTime) {
      onChangeScheduledTime(move.id, newDate, newTime);
      setShowRescheduleForm(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#101025] border border-[#D4AF37]/50 rounded-3xl p-6 sm:p-7 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.25)] text-center backdrop-blur-xl"
        >
          {/* Close button */}
          <button
            onClick={() => onDismiss(move.id)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Reminder"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Golden Bell Icon with breathing pulse */}
          <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#FFF1C5] p-[2px] shadow-[0_0_35px_rgba(212,175,55,0.45)]">
            <div className="w-full h-full rounded-[14px] bg-[#050510] flex items-center justify-center">
              <Bell className="w-8 h-8 text-[#D4AF37] animate-bounce" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-[#D4AF37]/20 blur-sm -z-10 animate-pulse" />
          </div>

          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-bold block">
            CRESCIVE
          </span>

          <h2 className="text-xl sm:text-2xl font-light font-serif-cresive text-white mt-1">
            &ldquo;It’s time for your Move.&rdquo;
          </h2>

          {/* Move Highlight Card */}
          <div className="my-5 p-4 rounded-2xl bg-[#050510]/80 border border-[#D4AF37]/30 text-left shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono uppercase tracking-wider font-semibold">
                {move.domain}
              </span>
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#D4AF37]" />
                {move.timeCommitment}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {move.title}
            </h3>

            {move.notes && (
              <p className="text-xs text-zinc-400 mt-1 italic font-light">
                &ldquo;{move.notes}&rdquo;
              </p>
            )}

            {(move.snoozeCount || 0) > 0 && (
              <div className="mt-2 text-[10px] text-amber-200/80 font-mono flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                <span>Postponed {move.snoozeCount} time{move.snoozeCount === 1 ? "" : "s"}</span>
              </div>
            )}
          </div>

          {/* SMART REMINDER BEHAVIOR: Proactive suggestion when postponed repeatedly */}
          {isRepeatedlyPostponed && !showRescheduleForm && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-left text-xs text-zinc-200"
            >
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F5D77F]">
                    Your Move has been postponed several times.
                  </p>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                    Would another time work better? You remain in full control.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setShowRescheduleForm(true)}
                      className="py-1 px-2.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-[11px] hover:bg-[#D4AF37]/30 transition-all cursor-pointer"
                    >
                      Change Time
                    </button>
                    <button
                      onClick={() => onSnooze(move.id, 10)}
                      className="py-1 px-2.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-[11px] transition-all cursor-pointer"
                    >
                      Keep Current Time
                    </button>
                    <button
                      onClick={() => onStopReminder(move.id)}
                      className="py-1 px-2.5 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-300 hover:bg-rose-500/20 text-[11px] transition-all cursor-pointer"
                    >
                      Stop Reminder
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reschedule Form if requested */}
          {showRescheduleForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleSaveReschedule}
              className="mb-5 p-4 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/30 text-left space-y-3"
            >
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                Choose a New Schedule
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#050510] border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#050510] border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRescheduleForm(false)}
                  className="py-1 px-3 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDate || !newTime}
                  className="py-1 px-3 rounded-lg bg-[#D4AF37] text-black font-bold text-xs hover:brightness-110 disabled:opacity-40 cursor-pointer"
                >
                  Save New Time
                </button>
              </div>
            </motion.form>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Primary Option: Deep Work Sanctuary */}
            {onStartInFocusSanctuary && (
              <button
                id="btn-reminder-enter-sanctuary"
                onClick={() => {
                  onStartInFocusSanctuary(move);
                  onDismiss(move.id);
                }}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#06b6d4] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(212,175,55,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current stroke-[2.5]" />
                <span>Enter Deep Work Sanctuary ({move.timeCommitment})</span>
              </button>
            )}

            {/* Direct Start Move */}
            <button
              onClick={() => onStartMove(move.id)}
              className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/15 border border-[#D4AF37]/30 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Mark Started (Standard)</span>
            </button>

            {/* Secondary Controls: Snooze & Dismiss */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                className={`flex-1 py-2.5 px-4 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  showSnoozeMenu
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                    : "bg-white/5 hover:bg-white/10 border-white/15 text-zinc-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Snooze...</span>
              </button>

              <button
                onClick={() => onDismiss(move.id)}
                className="py-2.5 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Snooze Options Drawer */}
          {showSnoozeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-left"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                Snooze Duration
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      onSnooze(move.id, mins);
                      setShowSnoozeMenu(false);
                    }}
                    className="py-2 px-1 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs font-semibold text-zinc-200 hover:text-[#D4AF37] transition-all text-center cursor-pointer"
                  >
                    +{mins} min
                  </button>
                ))}
              </div>

              {/* Custom Snooze */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Mins"
                  className="w-16 bg-[#050510] border border-white/15 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="text-[11px] text-zinc-400">minutes</span>
                <button
                  type="button"
                  onClick={handleCustomSnooze}
                  className="ml-auto py-1 px-3 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/30 transition-colors cursor-pointer"
                >
                  Choose Time
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
