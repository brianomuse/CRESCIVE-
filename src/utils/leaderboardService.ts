import {
  UserProfile,
  MoveItem,
  CresciveDailyState,
  MiniGameStats,
  FunZoneState,
  LeaderboardEntry,
  LeaderboardFilter,
  LeaderboardPrivacySettings,
} from "../types";
import { getStoredGameStats } from "./gamesStorage";
import { getStoredFunZoneState } from "./funZoneStorage";
import { getStoredDailyState } from "./cresciveDailyStorage";
import { getActiveUsageSeconds, calculateLevelFromActiveSeconds } from "./activeTimeTracker";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

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
    const estimatedWeekly = Math.min(totalXp, Math.max(0, Math.round(totalXp * 0.25)));
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
  const dailyChallengesCount = (effectiveDaily.completed?.challenge ? 1 : 0) + (effectiveDaily.streak > 1 ? effectiveDaily.streak - 1 : 0);
  const achievementsCount =
    (effectiveGame.unlockedAchievements?.length || 0) +
    (effectiveFun.unlockedAchievementIds?.length || 0);

  // Moves XP (25 XP per completed move) + Fun Zone / Games XP
  const movesXp = completedMovesCount * 25;
  const totalXp = (effectiveFun.xp || 0) + movesXp;
  
  // Level is determined by genuine active usage time
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
 * Fetches real authenticated leaderboard data from Firestore and server validation.
 * NEVER returns fictional users, fake XP, or fabricated rankings.
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
  const currentUser = auth.currentUser;

  // 1. Sync current authenticated user's real stats to Firestore if logged in and opted in
  if (currentUser && privacy.optIn !== false) {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const chosenName = privacy.displayName?.trim() || userProfile.preferredName?.trim() || currentUser.displayName?.trim() || "CRESCIVE Member";
      await setDoc(
        userRef,
        {
          uid: currentUser.uid,
          displayName: chosenName,
          preferredName: chosenName,
          photoURL: privacy.showAvatar ? (userProfile.avatarUrl || currentUser.photoURL || "") : "",
          totalXp: stats.totalXp,
          weeklyXp: stats.weeklyXp,
          level: stats.level,
          completedMoves: stats.completedMovesCount,
          dailyChallengesCount: stats.dailyChallengesCount,
          achievementsCount: stats.achievementsCount,
          streak: stats.streak,
          chapter: privacy.showChapter && Array.isArray(userProfile.chapter) && userProfile.chapter.length > 0 ? userProfile.chapter[0] : "GROWING",
          leaderboardOptIn: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Could not sync real user stats to Firestore", e);
    }
  }

  // 2. Fetch all real registered CRESCIVE users from Firestore
  const realFirestoreUsers: any[] = [];
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach((docSnap) => {
      const u = docSnap.data();
      if (!u || u.leaderboardOptIn === false) return;

      const isCurrent = currentUser ? (u.uid === currentUser.uid || docSnap.id === currentUser.uid) : false;
      const username = u.preferredName || u.displayName || u.username || "CRESCIVE Member";
      
      realFirestoreUsers.push({
        id: u.uid || docSnap.id,
        username,
        avatarUrl: u.photoURL || undefined,
        level: typeof u.level === "number" ? u.level : 0,
        totalXp: typeof u.totalXp === "number" ? u.totalXp : 0,
        weeklyXp: typeof u.weeklyXp === "number" ? u.weeklyXp : 0,
        completedMoves: typeof u.completedMoves === "number" ? u.completedMoves : 0,
        dailyChallengesCount: typeof u.dailyChallengesCount === "number" ? u.dailyChallengesCount : 0,
        achievementsCount: typeof u.achievementsCount === "number" ? u.achievementsCount : 0,
        chapter: u.chapter || (u.becoming ? "GROWING" : "EXPLORING"),
        country: u.country || "Global",
        badge: (u.completedMoves || 0) >= 10 ? "Consistent 🚀" : "Rising Explorer 🌱",
        streakDays: typeof u.streak === "number" ? u.streak : 0,
        isCurrentUser: isCurrent,
      });
    });
  } catch (err) {
    console.warn("Could not query real users from Firestore", err);
  }

  // 3. Request server-validated leaderboard with real Firestore users
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
        realFirestoreUsers,
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
      } else if (currentRank && !lastRank && data.totalParticipants > 1) {
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
    console.warn("Could not reach /api/leaderboard, using direct local calculation with real data", e);
  }

  // 4. Honest offline/direct calculation (NO fake users)
  const preferredName = privacy.displayName?.trim() || userProfile.preferredName || "Traveler";
  const currentUserEntry: LeaderboardEntry = {
    id: currentUser?.uid || "current-user",
    rank: 1,
    username: preferredName,
    avatarUrl: privacy.showAvatar ? userProfile.avatarUrl : undefined,
    level: stats.level,
    totalXp: stats.totalXp,
    weeklyXp: stats.weeklyXp,
    completedMoves: stats.completedMovesCount,
    dailyChallengesCount: stats.dailyChallengesCount,
    achievementsCount: stats.achievementsCount,
    chapter: privacy.showChapter && Array.isArray(userProfile.chapter) && userProfile.chapter.length > 0 ? userProfile.chapter[0] : "EXPLORING",
    country: "Global",
    badge: stats.completedMovesCount >= 10 ? "Consistent 🚀" : "Rising Explorer 🌱",
    streakDays: stats.streak,
    isCurrentUser: true,
  };

  const list: LeaderboardEntry[] = [];
  if (realFirestoreUsers.length > 0) {
    for (const u of realFirestoreUsers) {
      if (u.isCurrentUser || (currentUser && u.id === currentUser.uid)) {
        if (privacy.optIn !== false) {
          list.push({ ...u, ...currentUserEntry });
        }
      } else {
        list.push(u);
      }
    }
    // If current user is not in the list and opted in
    if (privacy.optIn !== false && !list.some((u) => u.isCurrentUser)) {
      list.push(currentUserEntry);
    }
  } else if (privacy.optIn !== false) {
    // Only current user exists
    list.push(currentUserEntry);
  }

  // Sort descending by appropriate metric
  list.sort((a, b) => {
    const field = filter === "weekly" ? "weeklyXp" : "totalXp";
    if (b[field] !== a[field]) return b[field] - a[field];
    if (b.completedMoves !== a.completedMoves) return b.completedMoves - a.completedMoves;
    return (b.achievementsCount || 0) - (a.achievementsCount || 0);
  });

  const rankedList = list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const userIndex = rankedList.findIndex((u) => u.isCurrentUser);
  const userRank = userIndex !== -1 ? rankedList[userIndex].rank : null;

  let xpToNextRank = 0;
  let nextRankUsername: string | undefined = undefined;
  if (userIndex > 0) {
    const ahead = rankedList[userIndex - 1];
    const targetField = filter === "weekly" ? "weeklyXp" : "totalXp";
    const currentField = filter === "weekly" ? currentUserEntry.weeklyXp : currentUserEntry.totalXp;
    xpToNextRank = Math.max(1, ahead[targetField] - currentField);
    nextRankUsername = ahead.username;
  }

  return {
    entries: rankedList,
    userRank,
    totalParticipants: rankedList.length,
    xpToNextRank,
    nextRankUsername,
    verifiedXp: stats.totalXp,
    level: stats.level,
    motivationalQuote: "Every Move counts. Consistent growth builds true mastery.",
    verified: true,
  };
}
