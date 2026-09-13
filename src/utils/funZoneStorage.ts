import { FunZoneState, FunAchievement } from "../types";
import { FUN_ACHIEVEMENTS } from "../data/funZoneData";

const FUN_ZONE_STORAGE_KEY = "crescive_fun_zone_state_v1";

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

const DEFAULT_FUN_STATE: FunZoneState = {
  xp: 0,
  streak: 0,
  lastActiveDate: "",
  favoritedJokeIds: [],
  jokesViewedCount: 0,
  gamesPlayedCount: 0,
  quizCorrectCount: 0,
  riddlesSolvedCount: 0,
  bestTapScore: 0,
  unlockedAchievementIds: [],
};

export function getStoredFunZoneState(): FunZoneState {
  try {
    const raw = localStorage.getItem(FUN_ZONE_STORAGE_KEY);
    if (!raw) return DEFAULT_FUN_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FUN_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_FUN_STATE;
  }
}

export function saveFunZoneState(state: FunZoneState): void {
  try {
    localStorage.setItem(FUN_ZONE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save Fun Zone state", e);
  }
}

export interface ActivityResult {
  updatedState: FunZoneState;
  xpEarned: number;
  newAchievements: FunAchievement[];
  isFirstActivityToday: boolean;
}

/**
 * Record user activity, updates daily streak and awards first-activity bonus (+10 XP) if applicable.
 */
export function recordFunActivity(
  baseState: FunZoneState,
  directXpGained: number = 0,
  actionType?: "quiz" | "game" | "joke" | "riddle" | "tap"
): ActivityResult {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let newStreak = baseState.streak;
  let isFirstToday = false;
  let totalXpGained = directXpGained;

  // Streak logic
  if (!baseState.lastActiveDate) {
    newStreak = 1;
    isFirstToday = true;
  } else if (baseState.lastActiveDate === today) {
    // Already active today, maintain streak
    newStreak = Math.max(1, baseState.streak);
  } else if (baseState.lastActiveDate === yesterday) {
    // Consecutive day
    newStreak = baseState.streak + 1;
    isFirstToday = true;
  } else {
    // Missed day, restart streak
    newStreak = 1;
    isFirstToday = true;
  }

  // First activity of day reward (+10 XP)
  if (baseState.firstDailyActivityDate !== today) {
    totalXpGained += 10;
  }

  let jokesViewed = baseState.jokesViewedCount;
  let gamesPlayed = baseState.gamesPlayedCount;
  let quizCorrect = baseState.quizCorrectCount;
  let riddlesSolved = baseState.riddlesSolvedCount;

  if (actionType === "joke") jokesViewed += 1;
  if (actionType === "game") gamesPlayed += 1;
  if (actionType === "quiz") {
    gamesPlayed += 1;
    quizCorrect += 1;
  }
  if (actionType === "riddle") {
    gamesPlayed += 1;
    riddlesSolved += 1;
  }
  if (actionType === "tap") {
    gamesPlayed += 1;
  }

  const interimState: FunZoneState = {
    ...baseState,
    xp: baseState.xp + totalXpGained,
    streak: newStreak,
    lastActiveDate: today,
    firstDailyActivityDate: today,
    jokesViewedCount: jokesViewed,
    gamesPlayedCount: gamesPlayed,
    quizCorrectCount: quizCorrect,
    riddlesSolvedCount: riddlesSolved,
  };

  // Evaluate achievements
  const newAchievements: FunAchievement[] = [];
  const currentUnlocked = new Set(interimState.unlockedAchievementIds);

  for (const ach of FUN_ACHIEVEMENTS) {
    if (currentUnlocked.has(ach.id)) continue;

    let isUnlocked = false;
    if (ach.id === "joke-explorer" && interimState.jokesViewedCount >= 10) isUnlocked = true;
    if (ach.id === "laugh-master" && interimState.jokesViewedCount >= 50) isUnlocked = true;
    if (ach.id === "game-starter" && interimState.gamesPlayedCount >= 1) isUnlocked = true;
    if (ach.id === "mini-gamer" && interimState.gamesPlayedCount >= 25) isUnlocked = true;
    if (ach.id === "brain-power" && interimState.quizCorrectCount >= 50) isUnlocked = true;
    if (ach.id === "fun-streak" && interimState.streak >= 7) isUnlocked = true;
    if (ach.id === "speed-tapper" && interimState.bestTapScore >= 30) isUnlocked = true;
    if (ach.id === "riddle-master" && interimState.riddlesSolvedCount >= 25) isUnlocked = true;
    if (ach.id === "fun-legend" && interimState.xp >= 1000) isUnlocked = true;
    // Focus Sanctuary achievements
    try {
      const rawFocus = localStorage.getItem("crescive_focus_stats_v1");
      if (rawFocus) {
        const focusStats = JSON.parse(rawFocus);
        if (ach.id === "first-flow" && (focusStats.totalSessionsCompleted || 0) >= 1) isUnlocked = true;
        if (ach.id === "deep-worker" && (focusStats.totalSessionsCompleted || 0) >= 5) isUnlocked = true;
        if (ach.id === "consistency-flow" && (focusStats.distinctDays?.length || 0) >= 3) isUnlocked = true;
        if (ach.id === "flow-master" && (focusStats.longestSessionMinutes || 0) >= 30) isUnlocked = true;
      }
    } catch {}

    if (isUnlocked) {
      currentUnlocked.add(ach.id);
      newAchievements.push(ach);
      // Award achievement XP
      interimState.xp += ach.xpReward;
    }
  }

  interimState.unlockedAchievementIds = Array.from(currentUnlocked);
  saveFunZoneState(interimState);

  return {
    updatedState: interimState,
    xpEarned: totalXpGained,
    newAchievements,
    isFirstActivityToday: isFirstToday,
  };
}

export function toggleFavoriteJokeInStorage(baseState: FunZoneState, jokeId: string): {
  updatedState: FunZoneState;
  isFavorited: boolean;
  xpAwarded: number;
} {
  const isAlreadyFav = baseState.favoritedJokeIds.includes(jokeId);
  let newFavs: string[];
  let xpAwarded = 0;

  if (isAlreadyFav) {
    newFavs = baseState.favoritedJokeIds.filter((id) => id !== jokeId);
  } else {
    newFavs = [...baseState.favoritedJokeIds, jokeId];
    // Reward +2 XP for adding a favorite
    xpAwarded = 2;
  }

  const updatedState: FunZoneState = {
    ...baseState,
    favoritedJokeIds: newFavs,
    xp: baseState.xp + xpAwarded,
  };

  saveFunZoneState(updatedState);
  return { updatedState, isFavorited: !isAlreadyFav, xpAwarded };
}

export function claimDailyJokeXp(baseState: FunZoneState): {
  updatedState: FunZoneState;
  claimed: boolean;
} {
  const today = getTodayDateString();
  if (baseState.dailyJokeClaimedDate === today) {
    return { updatedState: baseState, claimed: false };
  }

  const updatedState: FunZoneState = {
    ...baseState,
    xp: baseState.xp + 2,
    dailyJokeClaimedDate: today,
  };
  saveFunZoneState(updatedState);
  return { updatedState, claimed: true };
}

export function updateBestTapScore(baseState: FunZoneState, taps: number): FunZoneState {
  if (taps > baseState.bestTapScore) {
    const updatedState = { ...baseState, bestTapScore: taps };
    saveFunZoneState(updatedState);
    return updatedState;
  }
  return baseState;
}
