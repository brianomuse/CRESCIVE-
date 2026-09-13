/**
 * CRESCIVE Active Usage Time Tracker
 * 
 * Rules:
 * 1. A brand-new user starts at Level 0 (0 active seconds).
 * 2. Level is determined by genuine active session time, NOT idle or background time.
 * 3. XP determines leaderboard rank; Active Time determines Level.
 * 4. Pauses automatically if the tab is hidden or user has been idle for > 60 seconds.
 */

const ACTIVE_TIME_STORAGE_KEY = "crescive_active_time_seconds_v1";
export const ACTIVE_TIME_EVENT = "crescive-active-time-updated";

/**
 * Level progression thresholds in active seconds:
 * Level 0: 0 - 299s (< 5 minutes)
 * Level 1: 300s (5m)
 * Level 2: 900s (15m)
 * Level 3: 1,800s (30m)
 * Level 4: 3,600s (1h)
 * Level 5: 7,200s (2h)
 * Level 6: 12,600s (3.5h)
 * Level 7: 19,800s (5.5h)
 * Level 8: 28,800s (8h)
 * Level 9: 39,600s (11h)
 * Level 10: 54,000s (15h)
 * Level 11: 72,000s (20h)
 * Level 12+: +25,000s per level
 */
export function getSecondsForLevel(level: number): number {
  if (level <= 0) return 0;
  const thresholds = [
    0,       // Lvl 0
    300,     // Lvl 1 (5 mins)
    900,     // Lvl 2 (15 mins)
    1800,    // Lvl 3 (30 mins)
    3600,    // Lvl 4 (1 hour)
    7200,    // Lvl 5 (2 hours)
    12600,   // Lvl 6 (3.5 hours)
    19800,   // Lvl 7 (5.5 hours)
    28800,   // Lvl 8 (8 hours)
    39600,   // Lvl 9 (11 hours)
    54000,   // Lvl 10 (15 hours)
    72000,   // Lvl 11 (20 hours)
    97000,   // Lvl 12 (27 hours)
  ];
  if (level < thresholds.length) {
    return thresholds[level];
  }
  return thresholds[thresholds.length - 1] + (level - 12) * 28800;
}

export function getActiveUsageSeconds(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_TIME_STORAGE_KEY);
    if (!raw) return 0;
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  } catch {
    return 0;
  }
}

export function saveActiveUsageSeconds(seconds: number): void {
  try {
    localStorage.setItem(ACTIVE_TIME_STORAGE_KEY, Math.max(0, Math.floor(seconds)).toString());
    window.dispatchEvent(new CustomEvent(ACTIVE_TIME_EVENT, { detail: { seconds } }));
  } catch (e) {
    console.error("Failed to save active time", e);
  }
}

export interface UserLevelInfo {
  level: number;
  activeSeconds: number;
  currentLevelMinSeconds: number;
  nextLevelSeconds: number;
  progressPercent: number;
  formattedTime: string;
}

export function calculateLevelFromActiveSeconds(activeSeconds: number): UserLevelInfo {
  const safeSeconds = Math.max(0, activeSeconds);

  // Determine current level
  let level = 0;
  while (safeSeconds >= getSecondsForLevel(level + 1)) {
    level++;
    if (level > 100) break; // sanity bound
  }

  const currentLevelMinSeconds = getSecondsForLevel(level);
  const nextLevelSeconds = getSecondsForLevel(level + 1);
  const range = Math.max(1, nextLevelSeconds - currentLevelMinSeconds);
  const progressInLevel = Math.min(range, Math.max(0, safeSeconds - currentLevelMinSeconds));
  const progressPercent = Math.min(100, Math.round((progressInLevel / range) * 100));

  // Human readable active time
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  let formattedTime = "";
  if (hours > 0) {
    formattedTime = `${hours}h ${minutes}m active`;
  } else if (minutes > 0) {
    formattedTime = `${minutes}m active`;
  } else {
    formattedTime = `${safeSeconds}s active`;
  }

  return {
    level,
    activeSeconds: safeSeconds,
    currentLevelMinSeconds,
    nextLevelSeconds,
    progressPercent,
    formattedTime,
  };
}

let activeTrackerInitialized = false;
let accumulatedSeconds = 0;
let lastInteractionTimestamp = Date.now();

export function initActiveTimeTracker(): () => void {
  if (activeTrackerInitialized || typeof window === "undefined") {
    return () => {};
  }
  activeTrackerInitialized = true;
  accumulatedSeconds = getActiveUsageSeconds();
  lastInteractionTimestamp = Date.now();

  const handleUserActivity = () => {
    lastInteractionTimestamp = Date.now();
  };

  const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
  activityEvents.forEach((evt) => {
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });

  let syncCounter = 0;
  const interval = setInterval(() => {
    const isVisible = document.visibilityState === "visible";
    const isRecent = Date.now() - lastInteractionTimestamp < 60000; // active in last 60s

    if (isVisible && isRecent) {
      accumulatedSeconds += 1;
      syncCounter++;

      // Persist to storage every 5 seconds or immediately if level threshold reached
      if (syncCounter >= 5) {
        syncCounter = 0;
        saveActiveUsageSeconds(accumulatedSeconds);
      }
    }
  }, 1000);

  return () => {
    clearInterval(interval);
    activityEvents.forEach((evt) => {
      window.removeEventListener(evt, handleUserActivity);
    });
    activeTrackerInitialized = false;
    saveActiveUsageSeconds(accumulatedSeconds);
  };
}
