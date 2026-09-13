import { MiniGameStats, GameAchievement } from "../types";
import { getStoredFunZoneState, saveFunZoneState } from "./funZoneStorage";

const GAME_STATS_STORAGE_KEY = "crescive_mini_games_state_v1";

export const GAME_ACHIEVEMENTS: GameAchievement[] = [
  {
    id: "first-game",
    title: "First Game",
    description: "Play your first CRESCIVE 3D mini-game.",
    icon: "🏆",
    xpReward: 15,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "game-streak",
    title: "Game Streak",
    description: "Play mini-games on 3 different days.",
    icon: "🔥",
    xpReward: 30,
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: "brain-power",
    title: "Brain Power",
    description: "Complete 10 Brain Maze levels or puzzles.",
    icon: "🧠",
    xpReward: 40,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: "speed-runner",
    title: "Speed Runner",
    description: "Reach a distance of 1,000m in CRESCIVE Runner.",
    icon: "⚡",
    xpReward: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
  },
  {
    id: "focused",
    title: "Focused Mind",
    description: "Complete a Focus Challenge course without a single crash.",
    icon: "🎯",
    xpReward: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "xp-collector",
    title: "XP Collector",
    description: "Earn 250 total XP from CRESCIVE Mini Games.",
    icon: "💎",
    xpReward: 60,
    unlocked: false,
    progress: 0,
    maxProgress: 250,
  },
];

const DEFAULT_STATS: MiniGameStats = {
  totalGamesXpEarned: 0,
  gamesPlayed: 0,
  gamesCompleted: 0,
  runnerBestDistance: 0,
  runnerBestScore: 0,
  mazeLevelsCompleted: 0,
  mazeBestTime: 0,
  focusBestScore: 0,
  focusPerfectRuns: 0,
  unlockedAchievements: [],
  dailyGameStartsCount: {},
  lastPlayedDate: "",
  consecutivePlayDays: 0,
};

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStoredGameStats(): MiniGameStats {
  try {
    const raw = localStorage.getItem(GAME_STATS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveGameStats(stats: MiniGameStats): void {
  try {
    localStorage.setItem(GAME_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save mini game stats", e);
  }
}

export interface AwardXpResult {
  stats: MiniGameStats;
  xpAwarded: number;
  newAchievements: GameAchievement[];
  isPersonalBest: boolean;
}

/**
 * Core unified XP awarding mechanism for all 3D Mini Games.
 * Updates both MiniGameStats and the app's global FunZoneState.xp reservoir.
 */
export function awardGameXp(
  amount: number,
  reason: string,
  gameId: string,
  extraData?: {
    isStart?: boolean;
    runnerDistance?: number;
    runnerScore?: number;
    mazeLevel?: number;
    mazeTime?: number;
    focusScore?: number;
    focusPerfect?: boolean;
    isCompletion?: boolean;
  }
): AwardXpResult {
  const currentStats = getStoredGameStats();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let actualXpGained = amount;
  let isPersonalBest = false;

  // Anti-farming check for "Start Game": max 5 starts/day grant +2 XP
  if (extraData?.isStart) {
    const currentStartsToday = currentStats.dailyGameStartsCount[today] || 0;
    if (currentStartsToday >= 5) {
      actualXpGained = 0; // Cap reached for game starts
    }
  }

  // Update streak / days played
  let playDays = currentStats.consecutivePlayDays;
  if (!currentStats.lastPlayedDate) {
    playDays = 1;
  } else if (currentStats.lastPlayedDate === yesterday) {
    playDays += 1;
  } else if (currentStats.lastPlayedDate !== today) {
    playDays = 1;
  }

  const startsToday = (currentStats.dailyGameStartsCount[today] || 0) + (extraData?.isStart ? 1 : 0);

  // High score / personal best checks
  let runnerBestDist = currentStats.runnerBestDistance;
  let runnerBestScr = currentStats.runnerBestScore;
  let mazeLevels = currentStats.mazeLevelsCompleted;
  let mazeTime = currentStats.mazeBestTime;
  let focusBest = currentStats.focusBestScore;
  let focusPerfect = currentStats.focusPerfectRuns;

  if (extraData?.runnerDistance && extraData.runnerDistance > runnerBestDist) {
    runnerBestDist = extraData.runnerDistance;
    isPersonalBest = true;
  }
  if (extraData?.runnerScore && extraData.runnerScore > runnerBestScr) {
    runnerBestScr = extraData.runnerScore;
    isPersonalBest = true;
  }
  if (extraData?.mazeLevel && extraData.mazeLevel > mazeLevels) {
    mazeLevels = extraData.mazeLevel;
  }
  if (extraData?.mazeTime && (mazeTime === 0 || extraData.mazeTime < mazeTime)) {
    mazeTime = extraData.mazeTime;
    isPersonalBest = true;
  }
  if (extraData?.focusScore && extraData.focusScore > focusBest) {
    focusBest = extraData.focusScore;
    isPersonalBest = true;
  }
  if (extraData?.focusPerfect) {
    focusPerfect += 1;
  }

  const updatedStats: MiniGameStats = {
    ...currentStats,
    totalGamesXpEarned: currentStats.totalGamesXpEarned + actualXpGained,
    gamesPlayed: currentStats.gamesPlayed + (extraData?.isStart ? 1 : 0),
    gamesCompleted: currentStats.gamesCompleted + (extraData?.isCompletion ? 1 : 0),
    runnerBestDistance: runnerBestDist,
    runnerBestScore: runnerBestScr,
    mazeLevelsCompleted: mazeLevels,
    mazeBestTime: mazeTime,
    focusBestScore: focusBest,
    focusPerfectRuns: focusPerfect,
    dailyGameStartsCount: {
      ...currentStats.dailyGameStartsCount,
      [today]: startsToday,
    },
    lastPlayedDate: today,
    consecutivePlayDays: playDays,
  };

  // Check achievements
  const newAchievements: GameAchievement[] = [];
  const unlockedSet = new Set(updatedStats.unlockedAchievements);

  for (const ach of GAME_ACHIEVEMENTS) {
    if (unlockedSet.has(ach.id)) continue;

    let unlocked = false;
    if (ach.id === "first-game" && updatedStats.gamesPlayed >= 1) unlocked = true;
    if (ach.id === "game-streak" && updatedStats.consecutivePlayDays >= 3) unlocked = true;
    if (ach.id === "brain-power" && updatedStats.mazeLevelsCompleted >= 10) unlocked = true;
    if (ach.id === "speed-runner" && updatedStats.runnerBestDistance >= 1000) unlocked = true;
    if (ach.id === "focused" && updatedStats.focusPerfectRuns >= 1) unlocked = true;
    if (ach.id === "xp-collector" && updatedStats.totalGamesXpEarned >= 250) unlocked = true;

    if (unlocked) {
      unlockedSet.add(ach.id);
      newAchievements.push(ach);
      actualXpGained += ach.xpReward;
      updatedStats.totalGamesXpEarned += ach.xpReward;
    }
  }

  updatedStats.unlockedAchievements = Array.from(unlockedSet);
  saveGameStats(updatedStats);

  // Sync to app-wide global FunZone XP storage
  try {
    const funZone = getStoredFunZoneState();
    const updatedFunZone = {
      ...funZone,
      xp: (funZone.xp || 0) + actualXpGained,
    };
    saveFunZoneState(updatedFunZone);
  } catch (e) {
    console.error("Failed to sync game XP to FunZone", e);
  }

  // Dispatch custom event for real-time UI reaction
  if (actualXpGained > 0 && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("crescive:xp_gained", {
        detail: {
          amount: actualXpGained,
          reason,
          gameId,
          isPersonalBest,
        },
      })
    );
  }

  return {
    stats: updatedStats,
    xpAwarded: actualXpGained,
    newAchievements,
    isPersonalBest,
  };
}

export function getCalculatedGameAchievements(stats: MiniGameStats): GameAchievement[] {
  const unlockedSet = new Set(stats.unlockedAchievements);
  return GAME_ACHIEVEMENTS.map((ach) => {
    let progress = 0;
    if (ach.id === "first-game") progress = Math.min(1, stats.gamesPlayed);
    if (ach.id === "game-streak") progress = Math.min(3, stats.consecutivePlayDays);
    if (ach.id === "brain-power") progress = Math.min(10, stats.mazeLevelsCompleted);
    if (ach.id === "speed-runner") progress = Math.min(1000, stats.runnerBestDistance);
    if (ach.id === "focused") progress = Math.min(1, stats.focusPerfectRuns);
    if (ach.id === "xp-collector") progress = Math.min(250, stats.totalGamesXpEarned);

    return {
      ...ach,
      unlocked: unlockedSet.has(ach.id),
      progress,
    };
  });
}
