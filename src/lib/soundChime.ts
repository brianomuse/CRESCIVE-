/**
 * CRESCIVE Chat Notification Chime
 * Lightweight, respectful audio chime using the Web Audio API.
 * Does not depend on external assets, zero latency, and fully customizable/mutable.
 */

const STORAGE_KEY = "crescive_chat_sound_enabled";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Checks if sound notification is enabled by user preference (defaults to true).
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== "false";
}

/**
 * Updates sound notification preference.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

/**
 * Plays a warm, subtle two-tone notification chime (C5 -> E5).
 */
export function playIncomingMessageSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master gain node for gentle, respectful volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    masterGain.connect(ctx.destination);

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Tone 2: 659.25 Hz (E5)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    osc2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}
