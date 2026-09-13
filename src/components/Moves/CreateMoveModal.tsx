import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Sparkles,
  Clock,
  Calendar,
  Bell,
  BellOff,
  RotateCw,
  Check,
  Lightbulb,
  Edit3,
} from "lucide-react";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { MoveItem, UserProfile, MoveIdea } from "../../types";
import { MoveIdeasExplorer } from "./MoveIdeasExplorer";
import { AndroidPermissionModal } from "./AndroidPermissionModal";
import {
  getNotificationPermissionStatus,
  requestBrowserNotificationPermission,
  getStoredReminderSettings,
} from "../../utils/reminderEngine";

interface CreateMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMove: (move: Omit<MoveItem, "id" | "createdAt">) => void;
  defaultDomain?: string;
  userProfile?: UserProfile;
  initialMode?: "create" | "ideas";
}

export const CreateMoveModal: React.FC<CreateMoveModalProps> = ({
  isOpen,
  onClose,
  onAddMove,
  defaultDomain,
  userProfile,
  initialMode = "create",
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "ideas">(initialMode);

  // Form State
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(defaultDomain || "Knowledge & Learning");
  const [timeCommitment, setTimeCommitment] = useState("30 min");
  const [notes, setNotes] = useState("");

  // Scheduling & Reminders
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [repeatSchedule, setRepeatSchedule] = useState<"none" | "daily" | "weekdays" | "weekly">("none");
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // Permission Flow
  const [showAndroidPermissionPrompt, setShowAndroidPermissionPrompt] = useState(false);

  // Initialize dates and defaults on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      if (!scheduledDate) {
        const today = new Date().toISOString().split("T")[0];
        setScheduledDate(today);
      }
      if (!scheduledTime) {
        // Next clean hour
        const d = new Date();
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setScheduledTime(`${hh}:${mm}`);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleToggleReminder = async () => {
    if (!reminderEnabled) {
      // Check notification permission
      const status = getNotificationPermissionStatus();
      if (status === "default") {
        setShowAndroidPermissionPrompt(true);
        return;
      }
      setReminderEnabled(true);
    } else {
      setReminderEnabled(false);
    }
  };

  const handleAllowNotificationPermission = async () => {
    setShowAndroidPermissionPrompt(false);
    const result = await requestBrowserNotificationPermission();
    if (result === "granted") {
      setReminderEnabled(true);
    } else {
      // Even if blocked in browser, user can keep the in-app visual alarm enabled
      setReminderEnabled(true);
    }
  };

  const handleSelectIdea = (idea: MoveIdea, _autoFocusCustomization?: boolean) => {
    setTitle(idea.title);
    setDomain(idea.category);
    setTimeCommitment(idea.suggestedDuration);
    setNotes(idea.explanation);
    // Switch to customization view where user confirms and finalizes
    setActiveTab("create");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let reminderDateTime: string | undefined = undefined;
    if (reminderEnabled && scheduledDate && scheduledTime) {
      reminderDateTime = `${scheduledDate}T${scheduledTime}:00`;
    }

    onAddMove({
      title: title.trim(),
      domain,
      timeCommitment,
      completed: false,
      notes: notes.trim(),
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      repeatSchedule,
      reminderEnabled,
      reminderDateTime,
      snoozeCount: 0,
    });

    // Reset Form
    setTitle("");
    setNotes("");
    setReminderEnabled(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`relative w-full ${
              activeTab === "ideas" ? "max-w-2xl" : "max-w-lg"
            } bg-[#101025] border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.2)] my-auto backdrop-blur-xl transition-all duration-300`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Two Paths: CREATE MY OWN MOVE vs. EXPLORE MOVE IDEAS */}
            <div className="mb-5 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase font-semibold">
                  Trajectory Initiation
                </span>
              </div>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#050510] border border-white/10 mt-3">
                <button
                  type="button"
                  id="tab-create-my-own-move"
                  onClick={() => setActiveTab("create")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "create"
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>A. Create My Own Move</span>
                </button>

                <button
                  type="button"
                  id="tab-explore-move-ideas"
                  onClick={() => setActiveTab("ideas")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "ideas"
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>B. Explore Move Ideas</span>
                </button>
              </div>
            </div>

            {/* Content: Explore Move Ideas View */}
            {activeTab === "ideas" ? (
              <MoveIdeasExplorer
                userProfile={userProfile}
                onSelectIdea={handleSelectIdea}
                onSwitchToManual={() => setActiveTab("create")}
              />
            ) : (
              /* Content: Create / Customize My Own Move View */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Move Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Study Python data structures for 45 min"
                    className="w-full bg-[#050510] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-3.5 py-3 text-sm text-[#f5f5f0] placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
                    autoFocus
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Life Dimension
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full bg-[#050510] border border-white/15 focus:border-[#D4AF37]/60 rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f0] focus:outline-none cursor-pointer"
                    >
                      {CRESCIVE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.title}>
                          {cat.number}. {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Suggested Duration
                    </label>
                    <select
                      value={timeCommitment}
                      onChange={(e) => setTimeCommitment(e.target.value)}
                      className="w-full bg-[#050510] border border-white/15 focus:border-[#D4AF37]/60 rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f0] focus:outline-none cursor-pointer"
                    >
                      {["5 min", "10 min", "20 min", "30 min", "45 min", "1 hour", "2+ hours"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scheduling: Date & Time */}
                <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Schedule & Timing</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      When will you make this Move?
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        Scheduled Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-[#101025] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        Scheduled Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-[#101025] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                    {/* Repeat Schedule */}
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-[#D4AF37]" />
                        <span>Repeat Cadence</span>
                      </label>
                      <select
                        value={repeatSchedule}
                        onChange={(e) => setRepeatSchedule(e.target.value as any)}
                        className="w-full bg-[#101025] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="none">Does not repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays (Mon-Fri)</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    {/* Set Reminder Button / Toggle */}
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        id="btn-toggle-reminder"
                        onClick={handleToggleReminder}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          reminderEnabled
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {reminderEnabled ? (
                            <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span>Set Reminder</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            reminderEnabled
                              ? "bg-[#D4AF37] text-black font-bold"
                              : "bg-white/10 text-zinc-400"
                          }`}
                        >
                          {reminderEnabled ? "ACTIVE" : "OFF"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description / Intention */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Intention / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why this move matters today..."
                    className="w-full bg-[#050510] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-3.5 py-2 text-xs text-[#f5f5f0] placeholder:text-zinc-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Confirm & Cancel Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ideas")}
                    className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Browse Ideas</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-full border border-white/10 text-zinc-400 text-xs hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-add-move"
                      disabled={!title.trim()}
                      className={`py-2.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        title.trim()
                          ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Move</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Android Permission Modal */}
      <AndroidPermissionModal
        isOpen={showAndroidPermissionPrompt}
        onClose={() => setShowAndroidPermissionPrompt(false)}
        onAllow={handleAllowNotificationPermission}
      />
    </>
  );
};
