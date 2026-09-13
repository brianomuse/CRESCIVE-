import { CresciveDailyState } from "../types";
import {
  getDailyChallengeForDate,
  getDailyJokeForDate,
  getDailyTipForDate,
  getDailyGameTypeForDate,
} from "../data/cresciveDailyData";
import { getStoredFunZoneState, saveFunZoneState } from "./funZoneStorage";

export const DAILY_STORAGE_KEY = "crescive_daily_state_v1";

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function initializeDailyState(today: string, previousStreak: number = 0, lastCompletedDate?: string): CresciveDailyState {
  const challenge = getDailyChallengeForDate(today);
  const joke = getDailyJokeForDate(today);
  const tip = getDailyTipForDate(today);
  const gameType = getDailyGameTypeForDate(today);

  // Check if yesterday was completed to keep or reset streak
  const yesterday = getYesterdayDateString();
  let currentStreak = previousStreak;
  if (lastCompletedDate && lastCompletedDate !== yesterday && lastCompletedDate !== today) {
    currentStreak = 0; // Missed a day
  }

  return {
    date: today,
    completed: {
      challenge: false,
      joke: false,
      miniGame: false,
      tip: false,
    },
    bonusClaimed: false,
    xpEarnedToday: 0,
    streak: currentStreak,
    lastCompletedDate,
    todayChallengeId: challenge.id,
    todayJokeId: joke.id,
    todayTipId: tip.id,
    todayGameType: gameType,
  };
}

export function getStoredDailyState(): CresciveDailyState {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) {
      const fresh = initializeDailyState(today);
      saveDailyState(fresh);
      return fresh;
    }

    const parsed: CresciveDailyState = JSON.parse(raw);

    // If date has changed (new calendar day), reset daily moves and maintain or reset streak
    if (parsed.date !== today) {
      const yesterday = getYesterdayDateString();
      let streak = parsed.streak || 0;
      // If user didn't complete all moves yesterday, streak resets to 0
      if (parsed.lastCompletedDate !== yesterday && parsed.lastCompletedDate !== today) {
        streak = 0;
      }

      const fresh = initializeDailyState(today, streak, parsed.lastCompletedDate);
      saveDailyState(fresh);
      return fresh;
    }

    return parsed;
  } catch {
    const fresh = initializeDailyState(today);
    saveDailyState(fresh);
    return fresh;
  }
}

export function saveDailyState(state: CresciveDailyState): void {
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save CRESCIVE Daily state", e);
  }
}

export interface DailyActivityResult {
  state: CresciveDailyState;
  xpGained: number;
  allCompletedNow: boolean;
  isMilestone: boolean;
  milestoneDays?: number;
}

export const XP_VALUES = {
  challenge: 10,
  joke: 5,
  miniGame: 10,
  tip: 5,
  allCompleteBonus: 20,
};

/**
 * Marks one of the 4 daily moves as complete, awards XP once, and checks for full daily completion.
 */
export function completeDailyActivity(
  activity: "challenge" | "joke" | "miniGame" | "tip"
): DailyActivityResult {
  const currentState = getStoredDailyState();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Already completed today - no duplicate XP
  if (currentState.completed[activity]) {
    return {
      state: currentState,
      xpGained: 0,
      allCompletedNow: false,
      isMilestone: false,
    };
  }

  let xpGained = XP_VALUES[activity];
  const newCompleted = {
    ...currentState.completed,
    [activity]: true,
  };

  const isAllFour =
    newCompleted.challenge &&
    newCompleted.joke &&
    newCompleted.miniGame &&
    newCompleted.tip;

  let bonusAwarded = false;
  let newStreak = currentState.streak;
  let isMilestone = false;
  let milestoneDays: number | undefined = undefined;

  if (isAllFour && !currentState.bonusClaimed) {
    xpGained += XP_VALUES.allCompleteBonus;
    bonusAwarded = true;

    // Calculate updated streak
    if (currentState.lastCompletedDate === yesterday) {
      newStreak = (currentState.streak || 0) + 1;
    } else if (currentState.lastCompletedDate === today) {
      newStreak = Math.max(1, currentState.streak || 1);
    } else {
      newStreak = 1;
    }

    // Check milestones
    const MILESTONES = [3, 7, 14, 30, 50, 100];
    if (MILESTONES.includes(newStreak)) {
      isMilestone = true;
      milestoneDays = newStreak;
    }
  }

  const updatedState: CresciveDailyState = {
    ...currentState,
    completed: newCompleted,
    bonusClaimed: currentState.bonusClaimed || bonusAwarded,
    xpEarnedToday: currentState.xpEarnedToday + xpGained,
    streak: newStreak,
    lastCompletedDate: isAllFour ? today : currentState.lastCompletedDate,
  };

  saveDailyState(updatedState);

  // Sync XP to Fun Zone state so the overall app progress benefits!
  try {
    const funZone = getStoredFunZoneState();
    const updatedFunZone = {
      ...funZone,
      xp: (funZone.xp || 0) + xpGained,
    };
    saveFunZoneState(updatedFunZone);
  } catch (e) {
    console.error("Failed to sync Daily XP to FunZone storage", e);
  }

  return {
    state: updatedState,
    xpGained,
    allCompletedNow: isAllFour && bonusAwarded,
    isMilestone,
    milestoneDays,
  };
}
