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
  Layers,
  Shield,
  ExternalLink,
  Loader2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import { MoveItem, UserProfile, MoveIdea } from "../../types";
import { auth } from "../../lib/firebase";
import { MoveIdeasExplorer } from "./MoveIdeasExplorer";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  registerPushNotificationToken,
  saveMoveReminder,
} from "../../utils/notificationService";
import {
  isGoogleCalendarConnected,
  connectGoogleCalendar,
  createMoveCalendarEvent,
  updateMoveCalendarEvent,
} from "../../utils/googleCalendarService";

interface CreateMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMove: (move: Omit<MoveItem, "id" | "createdAt">) => void;
  onUpdateMove?: (id: string, updated: Partial<MoveItem>) => void;
  initialMove?: MoveItem | null;
  defaultDomain?: string;
  userProfile?: UserProfile;
  initialMode?: "create" | "ideas";
}

export const CreateMoveModal: React.FC<CreateMoveModalProps> = ({
  isOpen,
  onClose,
  onAddMove,
  onUpdateMove,
  initialMove,
  defaultDomain,
  userProfile,
  initialMode = "create",
}) => {
  const isEditing = Boolean(initialMove);
  const [activeTab, setActiveTab] = useState<"create" | "ideas">(initialMode);

  // Form State
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState(defaultDomain || "Knowledge & Learning");
  const [timeCommitment, setTimeCommitment] = useState("30 min");
  const [notes, setNotes] = useState("");

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [repeatSchedule, setRepeatSchedule] = useState<"none" | "daily" | "weekdays" | "weekly">("none");

  // Integrations
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [syncWithGoogleCalendar, setSyncWithGoogleCalendar] = useState(false);

  // Calendar Auth Modal & State
  const [showCalendarAuthModal, setShowCalendarAuthModal] = useState(false);
  const [isAuthorizingCalendar, setIsAuthorizingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      if (initialMove) {
        setTitle(initialMove.title);
        setDomain(initialMove.domain);
        setTimeCommitment(initialMove.timeCommitment);
        setNotes(initialMove.notes || "");
        setScheduledDate(initialMove.scheduledDate || "");
        setScheduledTime(initialMove.scheduledTime || "");
        setRepeatSchedule(initialMove.repeatSchedule || "none");
        setReminderEnabled(Boolean(initialMove.reminderEnabled));
        setSyncWithGoogleCalendar(Boolean(initialMove.googleCalendarEventId));
        setActiveTab("create");
      } else {
        setTitle("");
        setDomain(defaultDomain || "Knowledge & Learning");
        setTimeCommitment("30 min");
        setNotes("");
        setActiveTab(initialMode);

        const today = new Date().toISOString().split("T")[0];
        setScheduledDate(today);

        const d = new Date();
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setScheduledTime(`${hh}:${mm}`);

        setRepeatSchedule("none");
        setReminderEnabled(false);
        setSyncWithGoogleCalendar(isGoogleCalendarConnected());
      }
      setCalendarError(null);
    }
  }, [isOpen, initialMove, defaultDomain, initialMode]);

  if (!isOpen) return null;

  // Toggle Google Calendar
  const handleToggleGoogleCalendar = async () => {
    if (syncWithGoogleCalendar) {
      setSyncWithGoogleCalendar(false);
      return;
    }

    if (isGoogleCalendarConnected()) {
      setSyncWithGoogleCalendar(true);
    } else {
      setShowCalendarAuthModal(true);
    }
  };

  const handleAuthorizeCalendar = async () => {
    setIsAuthorizingCalendar(true);
    setCalendarError(null);
    try {
      const res = await connectGoogleCalendar();
      if (res.success) {
        setSyncWithGoogleCalendar(true);
        setShowCalendarAuthModal(false);
      } else {
        setCalendarError(res.error || "Authorization was cancelled.");
      }
    } catch (err: any) {
      setCalendarError(err.message || "Failed to authorize Google Calendar.");
    } finally {
      setIsAuthorizingCalendar(false);
    }
  };

  const handleToggleReminder = async () => {
    if (!reminderEnabled) {
      const status = getBrowserNotificationPermission();
      if (status === "granted") {
        setReminderEnabled(true);
        registerPushNotificationToken().catch(() => {});
      } else if (status === "default") {
        // Trigger browser's REAL native Notification.requestPermission()
        const result = await requestBrowserNotificationPermission();
        if (result === "granted") {
          setReminderEnabled(true);
          registerPushNotificationToken().catch(() => {});
        } else {
          setReminderEnabled(false);
        }
      } else {
        // Denied: browser blocks notifications
        setReminderEnabled(false);
      }
    } else {
      setReminderEnabled(false);
    }
  };

  const handleSelectIdea = (idea: MoveIdea) => {
    setTitle(idea.title);
    setDomain(idea.category);
    setTimeCommitment(idea.suggestedDuration);
    setNotes(idea.explanation);
    setActiveTab("create");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let reminderDateTime: string | undefined = undefined;
      if (reminderEnabled && scheduledDate && scheduledTime) {
        reminderDateTime = `${scheduledDate}T${scheduledTime}:00`;
      }

      let googleCalendarEventId = initialMove?.googleCalendarEventId;
      let googleCalendarHtmlLink = initialMove?.googleCalendarHtmlLink;
      let googleCalendarSyncedAt = initialMove?.googleCalendarSyncedAt;

      const baseMoveData: MoveItem = {
        id: initialMove?.id || Date.now().toString(),
        title: title.trim(),
        domain,
        timeCommitment,
        completed: initialMove?.completed || false,
        createdAt: initialMove?.createdAt || new Date().toISOString(),
        notes: notes.trim(),
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        repeatSchedule,
        reminderEnabled,
        reminderDateTime,
        snoozeCount: initialMove?.snoozeCount || 0,
        googleCalendarEventId,
        googleCalendarHtmlLink,
        googleCalendarSyncedAt,
      };

      // 1. Handle Google Calendar Integration
      if (syncWithGoogleCalendar) {
        try {
          if (googleCalendarEventId) {
            // Update existing event
            await updateMoveCalendarEvent(googleCalendarEventId, baseMoveData);
            googleCalendarSyncedAt = new Date().toISOString();
          } else {
            // Create new real Google Calendar event
            const created = await createMoveCalendarEvent(baseMoveData);
            googleCalendarEventId = created.eventId;
            googleCalendarHtmlLink = created.htmlLink;
            googleCalendarSyncedAt = new Date().toISOString();
          }
        } catch (calErr: any) {
          console.error("Google Calendar sync warning:", calErr);
          // Keep move saved even if calendar sync encountered network hitch
        }
      }

      const finalMovePayload = {
        title: title.trim(),
        domain,
        timeCommitment,
        completed: initialMove?.completed || false,
        notes: notes.trim(),
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        repeatSchedule,
        reminderEnabled,
        reminderDateTime,
        snoozeCount: initialMove?.snoozeCount || 0,
        googleCalendarEventId,
        googleCalendarHtmlLink,
        googleCalendarSyncedAt,
      };

      if (isEditing && initialMove && onUpdateMove) {
        onUpdateMove(initialMove.id, finalMovePayload);
        if (reminderEnabled && scheduledTime) {
          saveMoveReminder({
            id: `reminder_${initialMove.id}`,
            userId: auth.currentUser?.uid || "local",
            moveId: initialMove.id,
            moveTitle: finalMovePayload.title,
            scheduledTime,
            repeatSchedule: repeatSchedule === "none" ? "once" : repeatSchedule,
            enabled: true,
            createdAt: new Date().toISOString(),
          }).catch((err) => console.warn("Failed to persist Move Reminder:", err));
        }
      } else {
        onAddMove(finalMovePayload);
        if (reminderEnabled && scheduledTime) {
          saveMoveReminder({
            id: `reminder_${baseMoveData.id}`,
            userId: auth.currentUser?.uid || "local",
            moveId: baseMoveData.id,
            moveTitle: finalMovePayload.title,
            scheduledTime,
            repeatSchedule: repeatSchedule === "none" ? "once" : repeatSchedule,
            enabled: true,
            createdAt: new Date().toISOString(),
          }).catch((err) => console.warn("Failed to persist Move Reminder:", err));
        }
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
              activeTab === "ideas" ? "max-w-2xl" : "max-w-xl"
            } bg-[#101025] border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.2)] my-auto backdrop-blur-xl transition-all duration-300`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-5 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase font-semibold">
                  {isEditing ? "Modify Trajectory Move" : "Trajectory Initiation"}
                </span>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-mono">
                    Editing Move
                  </span>
                )}
              </div>

              {!isEditing && (
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
                    <span>Create My Own Move</span>
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
                    <span>Explore Ideas</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content: Explore Move Ideas View */}
            {activeTab === "ideas" && !isEditing ? (
              <MoveIdeasExplorer
                userProfile={userProfile}
                onSelectIdea={handleSelectIdea}
                onSwitchToManual={() => setActiveTab("create")}
              />
            ) : (
              /* Content: Create / Edit Move View */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Move Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Code for 45 minutes, Study AI, Walk in nature"
                    className="w-full bg-[#050510] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-3.5 py-2.5 text-xs text-[#f5f5f0] placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>

                {/* Domain & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Dimension
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {CRESCIVE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.title}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Target Duration
                    </label>
                    <select
                      value={timeCommitment}
                      onChange={(e) => setTimeCommitment(e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="15 min">15 minutes</option>
                      <option value="30 min">30 minutes</option>
                      <option value="45 min">45 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                    </select>
                  </div>
                </div>

                {/* Schedule Move Section */}
                <div className="p-4 rounded-2xl bg-[#050510] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Schedule Move</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400">Date & Cadence</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-[#101025] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-[#101025] border border-white/10 focus:border-[#D4AF37]/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                        <RotateCw className="w-2.5 h-2.5 text-[#D4AF37]" />
                        <span>Repeat</span>
                      </label>
                      <select
                        value={repeatSchedule}
                        onChange={(e) => setRepeatSchedule(e.target.value as any)}
                        className="w-full bg-[#101025] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="none">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  {/* Browser Reminder Toggle */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>In-App Notification Reminder</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleReminder}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        reminderEnabled
                          ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {reminderEnabled ? "ON" : "OFF"}
                    </button>
                  </div>

                  {/* Real Integrations Section */}
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-[#D4AF37]" />
                        <span>REAL SCHEDULING INTEGRATIONS</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">Independent options</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Google Calendar Option */}
                      <div
                        className={`p-3 rounded-2xl border transition-all ${
                          syncWithGoogleCalendar
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                            : "bg-[#101025] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className={`w-3.5 h-3.5 ${
                                syncWithGoogleCalendar ? "text-[#D4AF37]" : "text-zinc-400"
                              }`}
                            />
                            <span className="text-xs font-bold text-white">Google Calendar</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleGoogleCalendar}
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                              syncWithGoogleCalendar
                                ? "bg-[#D4AF37] text-black"
                                : "bg-white/10 text-zinc-300 hover:text-white"
                            }`}
                          >
                            {syncWithGoogleCalendar ? "CONNECTED" : "CONNECT"}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {syncWithGoogleCalendar
                            ? "Creates real primary calendar event with 10-min reminder."
                            : "Connect official Google Calendar to sync events."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes / Intention */}
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

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("ideas")}
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Browse Ideas</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-full border border-white/10 text-zinc-400 text-xs hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-add-move"
                      disabled={!title.trim() || isSubmitting}
                      className={`py-2.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        title.trim() && !isSubmitting
                          ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isEditing ? "Save Changes" : "Add Move"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Google Calendar Authorization Explanation Modal */}
      <AnimatePresence>
        {showCalendarAuthModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#101025] border border-[#D4AF37]/50 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto">
                <Calendar className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Connect Google Calendar</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  CRESCIVE requests permission to create and update calendar events representing your Moves
                  on your primary Google Calendar, along with 10-minute reminders.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Privacy & Security Guarantees</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
                  <li>Only requests calendar event permissions.</li>
                  <li>Never accesses emails, files, or passwords.</li>
                  <li>Tokens are cached in memory and never stored in cookies or web storage.</li>
                  <li>You can disconnect integration anytime in Profile.</li>
                </ul>
              </div>

              {calendarError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{calendarError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarAuthModal(false)}
                  disabled={isAuthorizingCalendar}
                  className="px-4 py-2 rounded-full border border-white/10 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeCalendar}
                  disabled={isAuthorizingCalendar}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  {isAuthorizingCalendar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Authorize Google Calendar</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
