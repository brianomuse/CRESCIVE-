import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react";
import {
  NotificationPermissionState,
  NotificationPreferences,
  MoveReminderItem,
  MoveItem,
} from "../../types";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  registerPushNotificationToken,
  unregisterPushNotificationToken,
  getStoredNotificationPreferences,
  saveNotificationPreferences,
  getMoveReminders,
  saveMoveReminder,
  deleteMoveReminder,
  toggleMoveReminder,
  dispatchMoveReminderNotification,
} from "../../utils/notificationService";
import { auth } from "../../lib/firebase";

interface NotificationSettingsSectionProps {
  availableMoves?: MoveItem[];
}

export const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  availableMoves = [],
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getStoredNotificationPreferences()
  );
  const [reminders, setReminders] = useState<MoveReminderItem[]>([]);
  const [isRegisteringToken, setIsRegisteringToken] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New / Edit Reminder State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [formMoveTitle, setFormMoveTitle] = useState("Daily Move");
  const [formMoveId, setFormMoveId] = useState<string>("daily_move");
  const [formTime, setFormTime] = useState("18:00");
  const [formRepeat, setFormRepeat] = useState<"daily" | "weekdays" | "weekly" | "once">("daily");

  // Refresh permission and load reminders on mount
  useEffect(() => {
    setPermissionState(getBrowserNotificationPermission());

    const loadData = async () => {
      const currentUid = auth.currentUser?.uid;
      const loadedReminders = await getMoveReminders(currentUid);

      // If user has no reminders yet, create a default "Daily Move at 6:00 PM"
      if (loadedReminders.length === 0) {
        const defaultReminder: MoveReminderItem = {
          id: `reminder_daily_${Date.now()}`,
          userId: currentUid || "local",
          moveId: "daily_move",
          moveTitle: "Daily Move",
          scheduledTime: "18:00",
          repeatSchedule: "daily",
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        await saveMoveReminder(defaultReminder);
        setReminders([defaultReminder]);
      } else {
        setReminders(loadedReminders);
      }
    };

    loadData();
  }, []);

  // Sync token whenever permission is granted and user is signed in
  useEffect(() => {
    if (permissionState === "granted" && auth.currentUser) {
      registerPushNotificationToken(auth.currentUser.uid).catch(() => {});
    }
  }, [permissionState]);

  // Request browser permission directly via native API
  const handleEnableNotifications = async () => {
    if (permissionState === "granted") return;

    setIsRegisteringToken(true);
    setActionNotice(null);

    try {
      // Calls browser's native Notification.requestPermission()
      const result = await requestBrowserNotificationPermission();
      setPermissionState(result);

      if (result === "granted") {
        if (auth.currentUser) {
          await registerPushNotificationToken(auth.currentUser.uid);
        }
        setActionNotice("Notifications enabled successfully.");
      } else if (result === "denied") {
        setActionNotice("Notifications blocked by browser settings.");
      }
    } catch (err) {
      console.error("Permission request failed:", err);
    } finally {
      setIsRegisteringToken(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    await saveNotificationPreferences(updated, auth.currentUser?.uid);

    // If all toggles are turned off, unregister token to save battery
    const anyEnabled = updated.chatMessages || updated.moveReminders || updated.cresciveUpdates;
    if (!anyEnabled) {
      await unregisterPushNotificationToken(auth.currentUser?.uid);
    } else if (permissionState === "granted" && auth.currentUser) {
      await registerPushNotificationToken(auth.currentUser.uid);
    }
  };

  const handleToggleReminder = async (id: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    await toggleMoveReminder(id, nextEnabled, auth.currentUser?.uid);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: nextEnabled } : r))
    );
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteMoveReminder(id, auth.currentUser?.uid);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleStartEditReminder = (reminder: MoveReminderItem) => {
    setEditingReminderId(reminder.id);
    setFormMoveTitle(reminder.moveTitle);
    setFormMoveId(reminder.moveId || "daily_move");
    setFormTime(reminder.scheduledTime);
    setFormRepeat(reminder.repeatSchedule);
    setIsAddingReminder(true);
  };

  const handleSaveReminderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUid = auth.currentUser?.uid || "local";

    const reminderItem: MoveReminderItem = {
      id: editingReminderId || `reminder_${Date.now()}`,
      userId: currentUid,
      moveId: formMoveId,
      moveTitle: formMoveTitle.trim() || "Daily Move",
      scheduledTime: formTime,
      repeatSchedule: formRepeat,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMoveReminder(reminderItem);

    if (editingReminderId) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editingReminderId ? reminderItem : r))
      );
    } else {
      setReminders((prev) => [...prev, reminderItem]);
    }

    setIsAddingReminder(false);
    setEditingReminderId(null);
    setFormMoveTitle("Daily Move");
    setFormMoveId("daily_move");
    setFormTime("18:00");
    setFormRepeat("daily");
    setActionNotice("Reminder saved.");
  };

  const handleTestReminder = async (reminder: MoveReminderItem) => {
    if (permissionState !== "granted") {
      await handleEnableNotifications();
      return;
    }
    await dispatchMoveReminderNotification(reminder);
    setActionNotice("Test notification dispatched to your browser.");
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#101025] border border-cyan-500/30 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#050510] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
              NOTIFICATIONS & REMINDERS
            </span>
            <h3 className="text-lg font-bold text-white leading-snug">
              Push Notification Preferences
            </h3>
          </div>
        </div>

        {/* Master Status Indicator */}
        <div className="shrink-0">
          {permissionState === "granted" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ACTIVE</span>
            </div>
          ) : permissionState === "denied" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>BLOCKED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              <span>UNCONFIGURED</span>
            </div>
          )}
        </div>
      </div>

      {/* Permission Banner & Action */}
      {permissionState === "denied" ? (
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Browser Permission Notice</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            Notifications are blocked for CRESCIVE in your browser settings. To receive chat messages and move reminders, please tap the lock icon in your browser address bar and change Notifications to "Allow".
          </p>
        </div>
      ) : permissionState === "default" ? (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Enable Real Push Notifications</h4>
            <p className="text-xs text-zinc-300 font-light">
              Receive genuine reminders for your scheduled moves and real-time alerts when friends message you in CRESCIVE Chat.
            </p>
          </div>
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={isRegisteringToken}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isRegisteringToken ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>REQUESTING...</span>
              </>
            ) : (
              <span>ENABLE NOTIFICATIONS</span>
            )}
          </button>
        </div>
      ) : null}

      {actionNotice && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real Notification Preferences Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold">
            DELIVERY CATEGORIES
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {permissionState !== "granted" ? "Requires browser permission" : "Active"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Chat Messages Option */}
          <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Chat messages</h4>
                <p className="text-[11px] text-zinc-400 font-light mt-0.5">
                  Real push notifications when another CRESCIVE member sends you a direct message.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePreference("chatMessages")}
              disabled={permissionState === "denied"}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                preferences.chatMessages && permissionState !== "denied"
                  ? "bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "bg-white/5 text-zinc-500 border border-white/10 hover:text-zinc-300"
              }`}
            >
              {preferences.chatMessages && permissionState !== "denied" ? "ON" : "OFF"}
            </button>
          </div>

          {/* Move Reminders Option */}
          <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Move reminders</h4>
                <p className="text-[11px] text-zinc-400 font-light mt-0.5">
                  Scheduled notifications when your planned daily moves are due.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePreference("moveReminders")}
              disabled={permissionState === "denied"}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                preferences.moveReminders && permissionState !== "denied"
                  ? "bg-[#D4AF37] text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                  : "bg-white/5 text-zinc-500 border border-white/10 hover:text-zinc-300"
              }`}
            >
              {preferences.moveReminders && permissionState !== "denied" ? "ON" : "OFF"}
            </button>
          </div>

          {/* Important CRESCIVE Updates */}
          <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Important CRESCIVE updates</h4>
                <p className="text-[11px] text-zinc-400 font-light mt-0.5">
                  Critical trajectory milestones, streak records, and essential system notices.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePreference("cresciveUpdates")}
              disabled={permissionState === "denied"}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                preferences.cresciveUpdates && permissionState !== "denied"
                  ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                  : "bg-white/5 text-zinc-500 border border-white/10 hover:text-zinc-300"
              }`}
            >
              {preferences.cresciveUpdates && permissionState !== "denied" ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* MOVE REMINDERS MANAGER */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
              SCHEDULED ALERTS
            </span>
            <h4 className="text-sm font-bold text-white">Move Reminders</h4>
          </div>

          {!isAddingReminder && (
            <button
              type="button"
              onClick={() => {
                setIsAddingReminder(true);
                setEditingReminderId(null);
                setFormMoveTitle("Daily Move");
                setFormMoveId("daily_move");
                setFormTime("18:00");
                setFormRepeat("daily");
              }}
              className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CREATE REMINDER</span>
            </button>
          )}
        </div>

        {/* Create / Edit Reminder Form */}
        <AnimatePresence>
          {isAddingReminder && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveReminderForm}
              className="p-4 rounded-2xl bg-[#050510] border border-cyan-500/40 space-y-3.5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {editingReminderId ? "EDIT REMINDER" : "CREATE NEW REMINDER"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Move Selection */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    TARGET MOVE
                  </label>
                  <select
                    value={formMoveId}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setFormMoveId(selectedVal);
                      if (selectedVal === "daily_move") {
                        setFormMoveTitle("Daily Move");
                      } else {
                        const m = availableMoves.find((item) => item.id === selectedVal);
                        if (m) setFormMoveTitle(m.title);
                      }
                    }}
                    className="w-full bg-[#101025] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="daily_move">DAILY MOVE</option>
                    {availableMoves.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reminder Time */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    TIME (24-HOUR)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full bg-[#101025] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Repeat Frequency */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                    REPEAT
                  </label>
                  <select
                    value={formRepeat}
                    onChange={(e) => setFormRepeat(e.target.value as any)}
                    className="w-full bg-[#101025] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Reminders List */}
        <div className="space-y-2">
          {reminders.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#050510] border border-white/5 text-center text-xs text-zinc-500">
              No Move reminders configured. Tap "CREATE REMINDER" to schedule your first alert.
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  reminder.enabled
                    ? "bg-[#050510] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                    : "bg-[#050510]/50 border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      reminder.enabled
                        ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/50"
                        : "bg-white/5 text-zinc-500 border border-white/10"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {reminder.moveTitle}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10 uppercase">
                        {reminder.scheduledTime}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 capitalize block mt-0.5">
                      {reminder.repeatSchedule} alert · Tapping notification opens Move
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Test notification button */}
                  <button
                    type="button"
                    onClick={() => handleTestReminder(reminder)}
                    title="Send test notification now"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleStartEditReminder(reminder)}
                    title="Edit reminder"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    title="Delete reminder"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Enable / Disable toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleReminder(reminder.id, reminder.enabled)}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      reminder.enabled
                        ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : "bg-white/5 text-zinc-500 border border-white/10 hover:text-zinc-300"
                    }`}
                  >
                    {reminder.enabled ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
