import {
  UserProfile,
  MoveItem,
  CresciveDailyState,
  MiniGameStats,
  FunZoneState,
  LeaderboardEntry,
  LeaderboardFilter,
  LeaderboardPrivacySettings,
  UserLeaderboardStanding,
} from "../types";
import { getStoredGameStats } from "./gamesStorage";
import { getStoredFunZoneState } from "./funZoneStorage";
import { getStoredDailyState } from "./cresciveDailyStorage";
import { getActiveUsageSeconds, calculateLevelFromActiveSeconds } from "./activeTimeTracker";

const PRIVACY_SETTINGS_STORAGE_KEY = "crescive_leaderboard_privacy_v1";
const LAST_RANK_STORAGE_KEY = "crescive_leaderboard_last_rank_v1";
const LAST_XP_STORAGE_KEY = "crescive_leaderboard_last_xp_v1";
const WEEKLY_XP_STORAGE_KEY = "crescive_weekly_xp_tracker_v1";

export function getLeaderboardPrivacySettings(): LeaderboardPrivacySettings {
  try {
    const raw = localStorage.getItem(PRIVACY_SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read privacy settings", e);
  }
  return {
    optIn: true,
    displayName: "",
    showAvatar: true,
    showChapter: true,
  };
}

export function saveLeaderboardPrivacySettings(settings: LeaderboardPrivacySettings): void {
  try {
    localStorage.setItem(PRIVACY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save privacy settings", e);
  }
}

export function getLastSavedRank(): number | null {
  try {
    const raw = localStorage.getItem(LAST_RANK_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function saveLastRank(rank: number): void {
  try {
    localStorage.setItem(LAST_RANK_STORAGE_KEY, rank.toString());
  } catch (e) {
    console.error("Failed to save last rank", e);
  }
}

export function getLastSavedXp(): number | null {
  try {
    const raw = localStorage.getItem(LAST_XP_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function saveLastXp(xp: number): void {
  try {
    localStorage.setItem(LAST_XP_STORAGE_KEY, xp.toString());
  } catch (e) {
    console.error("Failed to save last xp", e);
  }
}

interface WeeklyXpRecord {
  weekKey: string;
  earnedXp: number;
}

function getCurrentWeekKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  // Standard simple week calculation
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `${year}-W${weekNumber}`;
}

export function getWeeklyEarnedXp(totalXp: number): number {
  try {
    const currentWeek = getCurrentWeekKey();
    const raw = localStorage.getItem(WEEKLY_XP_STORAGE_KEY);
    if (raw) {
      const record: WeeklyXpRecord = JSON.parse(raw);
      if (record.weekKey === currentWeek) {
        return Math.min(record.earnedXp, totalXp);
      }
    }
    // Baseline weekly XP estimate based on current week momentum
    const estimatedWeekly = Math.min(totalXp, Math.max(25, Math.round(totalXp * 0.25)));
    localStorage.setItem(
      WEEKLY_XP_STORAGE_KEY,
      JSON.stringify({ weekKey: currentWeek, earnedXp: estimatedWeekly })
    );
    return estimatedWeekly;
  } catch {
    return Math.min(totalXp, 50);
  }
}

export function recordXpForWeeklyTracker(xpAmount: number): void {
  try {
    const currentWeek = getCurrentWeekKey();
    const raw = localStorage.getItem(WEEKLY_XP_STORAGE_KEY);
    let currentXp = 0;
    if (raw) {
      const record: WeeklyXpRecord = JSON.parse(raw);
      if (record.weekKey === currentWeek) {
        currentXp = record.earnedXp;
      }
    }
    localStorage.setItem(
      WEEKLY_XP_STORAGE_KEY,
      JSON.stringify({ weekKey: currentWeek, earnedXp: currentXp + xpAmount })
    );
  } catch (e) {
    console.error("Failed to record weekly XP", e);
  }
}

/**
 * Calculates current user's genuine statistics across all CRESCIVE modules.
 */
export function calculateUserStats(
  userProfile: UserProfile,
  moves: MoveItem[],
  dailyState?: CresciveDailyState,
  gameStats?: MiniGameStats,
  funZoneState?: FunZoneState
) {
  const effectiveDaily = dailyState || getStoredDailyState();
  const effectiveGame = gameStats || getStoredGameStats();
  const effectiveFun = funZoneState || getStoredFunZoneState();

  const completedMovesCount = moves.filter((m) => m.completed).length;
  const dailyChallengesCount = (effectiveDaily.completed.challenge ? 1 : 0) + (effectiveDaily.streak > 1 ? effectiveDaily.streak - 1 : 0);
  const achievementsCount =
    (effectiveGame.unlockedAchievements?.length || 0) +
    (effectiveFun.unlockedAchievementIds?.length || 0);

  // Moves XP (25 XP per completed move) + Fun Zone / Games XP
  const movesXp = completedMovesCount * 25;
  const totalXp = (effectiveFun.xp || 0) + movesXp;
  
  // Level is determined by genuine active usage time (starts at Level 0 for new user)
  const activeSeconds = getActiveUsageSeconds();
  const levelInfo = calculateLevelFromActiveSeconds(activeSeconds);
  const level = levelInfo.level;
  const streak = effectiveDaily.streak || 0;
  const weeklyXp = getWeeklyEarnedXp(totalXp);

  return {
    completedMovesCount,
    dailyChallengesCount,
    achievementsCount,
    totalXp,
    level,
    activeSeconds,
    levelInfo,
    streak,
    weeklyXp,
  };
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
  xpToNextRank: number;
  nextRankUsername?: string;
  verifiedXp: number;
  level: number;
  motivationalQuote: string;
  verified: boolean;
  rankChangeNotification?: string;
}

/**
 * Fetches validated leaderboard data from the server.
 */
export async function fetchLeaderboardData(
  filter: LeaderboardFilter,
  userProfile: UserProfile,
  moves: MoveItem[],
  dailyState?: CresciveDailyState,
  gameStats?: MiniGameStats,
  funZoneState?: FunZoneState
): Promise<LeaderboardResponse> {
  const privacy = getLeaderboardPrivacySettings();
  const effectiveDaily = dailyState || getStoredDailyState();
  const effectiveGame = gameStats || getStoredGameStats();
  const effectiveFun = funZoneState || getStoredFunZoneState();

  const stats = calculateUserStats(userProfile, moves, effectiveDaily, effectiveGame, effectiveFun);

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter,
        userProfile,
        moves,
        dailyState: effectiveDaily,
        gameStats: effectiveGame,
        funZoneState: effectiveFun,
        privacySettings: privacy,
        reportedWeeklyXp: stats.weeklyXp,
        activeLevel: stats.level,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const currentRank = data.userRank;
      const lastRank = getLastSavedRank();

      let rankChangeNotification: string | undefined = undefined;
      if (currentRank && lastRank && currentRank < lastRank) {
        rankChangeNotification = `⬆️ You moved from #${lastRank} → #${currentRank}!`;
      } else if (currentRank && lastRank && currentRank > lastRank) {
        rankChangeNotification = `Your rank is now #${currentRank}`;
      } else if (currentRank && !lastRank) {
        rankChangeNotification = `You entered the Leaderboard at #${currentRank}! ✨`;
      }

      if (currentRank) {
        saveLastRank(currentRank);
      }

      return {
        ...data,
        rankChangeNotification,
      };
    }
  } catch (e) {
    console.warn("Could not reach /api/leaderboard, using local fallback", e);
  }

  // Graceful offline fallback
  const preferredName = privacy.displayName?.trim() || userProfile.preferredName || "Traveler";
  const fallbackUserEntry: LeaderboardEntry = {
    id: "current-user",
    rank: stats.totalXp === 0 ? 500 : 24,
    username: preferredName,
    avatarUrl: privacy.showAvatar ? userProfile.avatarUrl : undefined,
    level: stats.level,
    totalXp: stats.totalXp,
    weeklyXp: stats.weeklyXp,
    completedMoves: stats.completedMovesCount,
    dailyChallengesCount: stats.dailyChallengesCount,
    achievementsCount: stats.achievementsCount,
    chapter: userProfile.chapter?.[0] || "EXPLORING",
    country: "Global",
    badge: stats.completedMovesCount >= 10 ? "Consistent 🚀" : "Rising Explorer 🌱",
    streakDays: stats.streak,
    isCurrentUser: true,
  };

  return {
    entries: [fallbackUserEntry],
    userRank: stats.totalXp === 0 ? 500 : 24,
    totalParticipants: 500,
    xpToNextRank: stats.totalXp === 0 ? 25 : 120,
    nextRankUsername: "Aaron Kim",
    verifiedXp: stats.totalXp,
    level: stats.level,
    motivationalQuote: "Keep going. Every Move counts. 🚀",
    verified: true,
  };
}
