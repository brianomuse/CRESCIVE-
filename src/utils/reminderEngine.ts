import { ReminderSettings, MoveItem } from "../types";

export const STORAGE_KEY_REMINDER_SETTINGS = "crescive_reminder_settings_v1";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  remindersEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  defaultTimingMinutes: 0, // at the exact time
};

export function getStoredReminderSettings(): ReminderSettings {
  if (typeof window === "undefined") return DEFAULT_REMINDER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDER_SETTINGS);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function saveStoredReminderSettings(settings: ReminderSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_REMINDER_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save reminder settings", err);
  }
}

export function getNotificationPermissionStatus(): "default" | "granted" | "denied" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as "default" | "granted" | "denied";
}

export async function requestBrowserNotificationPermission(): Promise<"granted" | "denied" | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const perm = await Notification.requestPermission();
    return perm as "granted" | "denied";
  } catch (e) {
    console.error("Error requesting notification permission", e);
    return "denied";
  }
}

// Crystalline Web Audio Bell Synthesizer (Zero asset dependencies, zero network requests, instant playback)
export function playCresciveChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First bell tone (Golden A5 ~ 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(882, now + 1.2);

    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic fifth tone (E6 ~ 1320Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.08);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.18, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Warm sub-harmonic (D5 ~ 587.3Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(587.33, now + 0.15);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.12, now + 0.15);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc3.start(now + 0.15);

    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
    osc3.stop(now + 2.2);
  } catch (err) {
    console.warn("Audio chime could not play due to browser policy:", err);
  }
}

export function triggerVibration(pattern: number | number[] = [200, 100, 200]): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export function sendBrowserNotification(move: MoveItem): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification("CRESCIVE — It's time for your Move", {
      body: `"${move.title}" (${move.timeCommitment}) · Your future is in progress.`,
      icon: "/crescive_logo.png",
      tag: `move-reminder-${move.id}`,
    });
  } catch (e) {
    console.warn("Could not dispatch browser notification", e);
  }
}
