import { FocusSession, FocusStats, FocusReflectionChoice, FunAchievement } from "../types";
import { FUN_ACHIEVEMENTS } from "../data/funZoneData";
import { getStoredFunZoneState, saveFunZoneState, getTodayDateString } from "./funZoneStorage";
import { recordXpForWeeklyTracker } from "./leaderboardService";

const STORAGE_KEY_FOCUS_STATS = "crescive_focus_stats_v1";
const STORAGE_KEY_PROCESSED_SESSIONS = "crescive_processed_focus_sessions_v1";

const DEFAULT_FOCUS_STATS: FocusStats = {
  totalSessionsCompleted: 0,
  totalFocusMinutes: 0,
  sessionsHistory: [],
  distinctDays: [],
  longestSessionMinutes: 0,
};

export function getStoredFocusStats(): FocusStats {
  if (typeof window === "undefined") return DEFAULT_FOCUS_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOCUS_STATS);
    if (!raw) return DEFAULT_FOCUS_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FOCUS_STATS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FOCUS_STATS;
  }
}

export function saveStoredFocusStats(stats: FocusStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_FOCUS_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save focus stats", e);
  }
}

/**
 * Parses duration strings like "15 min", "30 min", "1 hour", "45 min" to integer minutes.
 */
export function parseDurationMinutes(timeStr?: string): number {
  if (!timeStr) return 15;
  const lower = timeStr.toLowerCase().trim();
  if (lower.includes("hour")) {
    const match = lower.match(/\d+(\.\d+)?/);
    const hrs = match ? parseFloat(match[0]) : 1;
    return Math.round(hrs * 60);
  }
  const match = lower.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 15;
}

/**
 * Calculates XP earned for a completed focus session:
 * - Base Move XP: 25 XP
 * - Duration Flow Bonus:
 *   - 5-14 min: +10 XP
 *   - 15-29 min: +20 XP
 *   - 30-59 min: +35 XP
 *   - 60+ min: +60 XP
 */
export function calculateFocusXp(durationMinutes: number): { baseMoveXp: number; flowBonusXp: number; totalXp: number } {
  const baseMoveXp = 25;
  let flowBonusXp = 15;
  if (durationMinutes < 15) {
    flowBonusXp = 10;
  } else if (durationMinutes < 30) {
    flowBonusXp = 20;
  } else if (durationMinutes < 60) {
    flowBonusXp = 35;
  } else {
    flowBonusXp = 60;
  }
  return {
    baseMoveXp,
    flowBonusXp,
    totalXp: baseMoveXp + flowBonusXp,
  };
}

export interface FocusSessionResult {
  session: FocusSession;
  baseMoveXp: number;
  flowBonusXp: number;
  totalXp: number;
  newAchievements: FunAchievement[];
}

/**
 * Records a genuinely completed focus session, updates streak, awards XP,
 * and checks Focus Sanctuary achievements.
 * Prevents duplicate/fake completions.
 */
export function recordFocusSessionCompletion(params: {
  moveId?: string;
  moveTitle: string;
  domain?: string;
  durationMinutes: number;
  actualActiveSeconds: number;
}): FocusSessionResult {
  const today = getTodayDateString();
  const { baseMoveXp, flowBonusXp, totalXp } = calculateFocusXp(params.durationMinutes);

  const sessionId = `focus-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const completedAt = new Date().toISOString();

  const newSession: FocusSession = {
    id: sessionId,
    moveId: params.moveId,
    moveTitle: params.moveTitle,
    domain: params.domain || "Focus Sanctuary",
    durationMinutes: params.durationMinutes,
    completedAt,
    xpEarned: totalXp,
  };

  // Update Focus Stats
  const currentStats = getStoredFocusStats();
  const updatedDistinctDays = currentStats.distinctDays.includes(today)
    ? currentStats.distinctDays
    : [...currentStats.distinctDays, today];

  const updatedStats: FocusStats = {
    totalSessionsCompleted: currentStats.totalSessionsCompleted + 1,
    totalFocusMinutes: currentStats.totalFocusMinutes + params.durationMinutes,
    sessionsHistory: [newSession, ...currentStats.sessionsHistory].slice(0, 50),
    distinctDays: updatedDistinctDays,
    longestSessionMinutes: Math.max(currentStats.longestSessionMinutes, params.durationMinutes),
  };
  saveStoredFocusStats(updatedStats);

  // Update Fun Zone / Global Progression State
  const funState = getStoredFunZoneState();
  const newAchievements: FunAchievement[] = [];
  const currentUnlocked = new Set(funState.unlockedAchievementIds);

  // Evaluate Focus Achievements
  for (const ach of FUN_ACHIEVEMENTS) {
    if (currentUnlocked.has(ach.id)) continue;

    let isUnlocked = false;
    if (ach.id === "first-flow" && updatedStats.totalSessionsCompleted >= 1) isUnlocked = true;
    if (ach.id === "deep-worker" && updatedStats.totalSessionsCompleted >= 5) isUnlocked = true;
    if (ach.id === "consistency-flow" && updatedStats.distinctDays.length >= 3) isUnlocked = true;
    if (ach.id === "flow-master" && params.durationMinutes >= 30) isUnlocked = true;

    if (isUnlocked) {
      currentUnlocked.add(ach.id);
      newAchievements.push(ach);
    }
  }

  // Calculate achievement bonus XP
  const achievementBonusXp = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
  const totalXpToBank = totalXp + achievementBonusXp;

  // Streak logic
  let newStreak = funState.streak || 0;
  if (!funState.lastActiveDate) {
    newStreak = 1;
  } else if (funState.lastActiveDate === today) {
    newStreak = Math.max(1, funState.streak);
  } else {
    // Check if yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (funState.lastActiveDate === yesterdayStr) {
      newStreak = funState.streak + 1;
    } else {
      newStreak = 1;
    }
  }

  const updatedFunState = {
    ...funState,
    xp: funState.xp + totalXpToBank,
    streak: newStreak,
    lastActiveDate: today,
    firstDailyActivityDate: funState.firstDailyActivityDate || today,
    unlockedAchievementIds: Array.from(currentUnlocked),
  };
  saveFunZoneState(updatedFunState);

  // Sync with weekly leaderboard
  recordXpForWeeklyTracker(totalXpToBank);

  return {
    session: newSession,
    baseMoveXp,
    flowBonusXp,
    totalXp: totalXpToBank,
    newAchievements,
  };
}

/**
 * Records the user's post-session reflection choice ("flow", "good", "some_friction", "heavy_friction").
 * Awards +10 XP reflection bonus once per session (guards against duplicate rewards).
 */
export function recordFocusReflection(
  sessionId: string,
  choice: FocusReflectionChoice
): { success: boolean; xpAwarded: number } {
  try {
    const rawProcessed = localStorage.getItem(STORAGE_KEY_PROCESSED_SESSIONS);
    const processedSet = new Set<string>(rawProcessed ? JSON.parse(rawProcessed) : []);

    if (processedSet.has(sessionId)) {
      return { success: false, xpAwarded: 0 }; // Already claimed
    }

    processedSet.add(sessionId);
    localStorage.setItem(STORAGE_KEY_PROCESSED_SESSIONS, JSON.stringify(Array.from(processedSet)));

    // Update session reflection in stats
    const stats = getStoredFocusStats();
    stats.sessionsHistory = stats.sessionsHistory.map((s) => {
      if (s.id === sessionId) {
        return { ...s, reflection: choice, xpEarned: s.xpEarned + 10 };
      }
      return s;
    });
    saveStoredFocusStats(stats);

    // Award +10 XP
    const funState = getStoredFunZoneState();
    const updatedFunState = {
      ...funState,
      xp: funState.xp + 10,
    };
    saveFunZoneState(updatedFunState);
    recordXpForWeeklyTracker(10);

    return { success: true, xpAwarded: 10 };
  } catch (e) {
    console.error("Failed to record reflection", e);
    return { success: false, xpAwarded: 0 };
  }
}
